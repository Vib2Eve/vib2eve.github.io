/* Painting U: local evidence validation and conservative demonstration rules. */
(function () {
  'use strict';

  const MAX_SEGMENTS = 200;
  const MAX_TIME = 86400;
  const QUALITIES = new Set(['clean', 'distorted', 'inaudible']);

  function textValue(value, name, limit, allowEmpty = false) {
    if (typeof value !== 'string' || value.length > limit || (!allowEmpty && !value.trim())) {
      throw new Error(`${name} must be ${allowEmpty ? 'a' : 'a non-empty'} string of at most ${limit} characters.`);
    }
    return value.trim();
  }

  /** Return a sorted, independent schema-only copy; never truncate evidence. */
  function validateSegments(rows) {
    if (!Array.isArray(rows) || rows.length < 1 || rows.length > MAX_SEGMENTS) {
      throw new Error('Evidence must contain 1–200 segments.');
    }
    const used = new Set();
    const clean = rows.map((row, index) => {
      const name = `Segment ${index + 1}`;
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw new Error(`${name} must be an object.`);
      }
      const id = textValue(row.id, `${name} ID`, 40);
      if (used.has(id)) throw new Error(`${name} has a duplicate ID: ${id}.`);
      used.add(id);
      if (row.source !== 'wearer' && row.source !== 'loudspeaker') {
        throw new Error(`${name} source must be wearer or loudspeaker.`);
      }
      if (typeof row.start !== 'number' || typeof row.end !== 'number' ||
          !Number.isFinite(row.start) || !Number.isFinite(row.end) ||
          row.start < 0 || row.start >= row.end || row.end > MAX_TIME) {
        throw new Error(`${name} times must be finite numbers with 0 ≤ start < end ≤ 86400.`);
      }
      const result = { id, source: row.source, start: row.start, end: row.end };
      if (row.source === 'wearer') {
        if (!Array.isArray(row.keywords) || row.keywords.length > 80) {
          throw new Error(`${name} keywords must be a list of at most 80 strings.`);
        }
        result.keywords = row.keywords.map((word, i) =>
          textValue(word, `${name} keyword ${i + 1}`, 80));
      } else {
        result.speaker = textValue(row.speaker === undefined ? 'Remote' : row.speaker, `${name} speaker`, 80);
        result.quality = row.quality === undefined ? 'distorted' : row.quality;
        if (!QUALITIES.has(result.quality)) {
          throw new Error(`${name} quality must be clean, distorted, or inaudible.`);
        }
        result.text = textValue(row.text, `${name} text`, 4000);
      }
      return result;
    });
    return clean.sort((a, b) => a.start - b.start || a.end - b.end);
  }

  const verificationPattern = /\bverifi[a-z]*(?:\[\?\])?|\botp\b|\bcode\b|\bone[- ]time password\b|验证码|校验码|动态码|一次性密码/i;
  const requestPattern = /[?？]|\b(?:what|tell|read|enter|provide|share|send|confirm|verify)\b|请|多少|告诉|输入|提供|报出|确认/i;
  const supportPattern = /\b(?:glad|happy|pleased) to help\b|\b(?:i|we)(?:'ll| will) (?:handle|process|assist|help)\b|\b(?:how|what) (?:can|may) (?:i|we) help\b|\b(?:this is|you(?:'ve| have) reached) (?:customer|technical) support\b|很高兴为您|为您(?:办理|处理|服务)|我是.*客服|有什么可以帮/i;
  const highFinancePattern = /\b(?:loans?|mortgage|account balance|interest rate|credit limit)\b|贷款|房贷|账户余额|利率|授信额度/i;
  const mediumFinancePattern = /\b(?:payments?|subscription|billing|monthly fee)\b|支付|订阅|账单|月费/i;
  const ids = rows => [...new Set(rows.map(row => row.id))];
  const rowText = row => row.source === 'wearer' ? row.keywords.join(' ') : row.text;
  const usable = row => row.source === 'wearer' || row.quality !== 'inaudible';

  /* Each group stays within an uninterrupted sequence of neighboring wearer
     segments. A complete code in one segment is never joined to another code. */
  function digitGroups(rows) {
    const groups = [];
    let pending = null;
    function finish() {
      if (pending && pending.digits.length >= 4 && pending.digits.length <= 8) groups.push(pending);
      pending = null;
    }
    for (const row of rows) {
      if (row.source !== 'wearer') { finish(); continue; }
      const numeric = row.keywords.filter(word => /^\d+$/.test(word));
      const singleDigits = numeric.every(word => /^\d$/.test(word));
      const explicit = numeric.length === 1 && /^\d{4,8}$/.test(numeric[0]);
      const marker = verificationPattern.test(rowText(row));
      if (explicit || (singleDigits && numeric.length >= 4 && numeric.length <= 8)) {
        const preceding = pending && pending.digits.length === 0 &&
          row.start >= pending.end && row.start - pending.end <= 2 ? pending.rows : [];
        finish();
        groups.push({ rows: [...preceding, row], digits: numeric.join(''),
          start: preceding.length ? preceding[0].start : row.start, end: row.end });
        continue;
      }
      if (!singleDigits || numeric.length > 8 || (!numeric.length && !marker)) { finish(); continue; }
      if (pending && (row.start < pending.end || row.start - pending.end > 2)) finish();
      if (!pending) pending = { rows: [], digits: '', start: row.start, end: row.end };
      pending.rows.push(row);
      pending.digits += numeric.join('');
      pending.end = row.end;
    }
    finish();
    return groups;
  }

  const messages = {
    en: {
      unknown: 'Undetermined', empty: 'No evidence to analyze.',
      noCode: 'No supported verification code was found.',
      code: value => `Verification code: ${value}`,
      digits: value => `Digit sequence: ${value}; its purpose is undetermined.`,
      several: value => `Separate digit sequences: ${value}.`,
      sequence: (value, refs) => `Ordered digit cues → ${value} (${refs}).`,
      request: refs => `Remote verification request supported by ${refs}.`,
      ownContext: refs => `Verification context comes from wearer keywords (${refs}).`,
      noRequest: 'No remote verification request is linked to the digit sequence.',
      service: refs => `Remote service language supports a customer-support role (${refs}).`,
      limits: 'Isolated keywords do not establish the wearer’s identity or age.',
      support: 'Customer support (inferred)', serviceScene: 'Service verification (inferred)',
      exchange: 'Verification exchange (inferred)', cues: 'Verification cues',
      requestScene: 'Verification request', high: 'High · financial topic',
      medium: 'Medium · payment topic', low: 'Low · credential',
    },
    zh: {
      unknown: '无法确定', empty: '暂无可分析的证据。', noCode: '未找到有依据的验证码。',
      code: value => `验证码：${value}`,
      digits: value => `数字序列：${value}；用途无法确定。`,
      several: value => `独立数字序列：${value}。`,
      sequence: (value, refs) => `按时间排列的数字线索 → ${value}（${refs}）。`,
      request: refs => `远端核验请求的证据：${refs}。`,
      ownContext: refs => `核验语境来自佩戴者关键词（${refs}）。`,
      noRequest: '没有与该数字序列关联的远端核验请求。',
      service: refs => `远端服务用语支持其客服角色的推断（${refs}）。`,
      limits: '孤立关键词不足以确定佩戴者的身份或年龄。',
      support: '客服（推断）', serviceScene: '服务核验（推断）',
      exchange: '核验交互（推断）', cues: '核验线索', requestScene: '核验请求',
      high: '高 · 金融话题', medium: '中 · 支付话题', low: '低 · 凭证',
    },
  };

  /** Analyze supplied evidence only. No API, network, storage, or wearer transcript. */
  function analyzeLocally(items, lang = 'en') {
    const t = messages[lang === 'zh' ? 'zh' : 'en'];
    const unknown = () => ({ label: t.unknown, evidence: [] });
    const result = { mode: 'local', dialogue: t.empty, links: [], profile: {
      remote_role: unknown(), identity: unknown(), scene: unknown(),
      age_group: unknown(), financial_sensitivity: unknown(),
    } };
    if (Array.isArray(items) && items.length === 0) return result;
    const rows = validateSegments(items);
    const remote = rows.filter(row => row.source === 'loudspeaker' && usable(row));
    const requests = remote.filter(row => verificationPattern.test(row.text) && requestPattern.test(row.text));
    const support = remote.filter(row => supportPattern.test(row.text));
    const groups = digitGroups(rows).map(group => {
      /* The nearest preceding remote turn must itself request a code. This
         prevents borrowing context across a later, unrelated remote turn. */
      const preceding = rows.filter(row => row.source === 'loudspeaker' && row.end <= group.start)
        .sort((a, b) => b.end - a.end)[0];
      const request = preceding && group.start - preceding.end <= 8 && requests.includes(preceding)
        ? preceding : null;
      const markers = group.rows.filter(row => verificationPattern.test(rowText(row)));
      return { ...group, request, markers, verified: !!request || markers.length > 0 };
    });
    const verified = groups.filter(group => group.verified);
    if (groups.length === 1) {
      result.dialogue = groups[0].verified ? t.code(groups[0].digits) : t.digits(groups[0].digits);
    } else if (groups.length > 1) {
      result.dialogue = t.several(groups.map(group => group.digits).join(', '));
    } else result.dialogue = t.noCode;

    groups.forEach(group => {
      result.links.push(t.sequence(group.digits, ids(group.rows).join(', ')));
      if (group.request) result.links.push(t.request(group.request.id));
      else {
        if (group.markers.length) result.links.push(t.ownContext(ids(group.markers).join(', ')));
        result.links.push(t.noRequest);
      }
    });
    if (support.length) {
      result.profile.remote_role = { label: t.support, evidence: ids(support) };
      result.links.push(t.service(ids(support).join(', ')));
    }
    if (verified.length) {
      const linked = verified.filter(group => group.request);
      const linkedService = linked.some(group => support.some(row =>
        row.speaker === group.request.speaker && Math.abs(row.start - group.request.start) <= 8));
      const evidence = verified.flatMap(group => [...group.rows, ...(group.request ? [group.request] : [])]);
      if (linkedService) evidence.push(...support.filter(row => linked.some(group =>
        row.speaker === group.request.speaker && Math.abs(row.start - group.request.start) <= 8)));
      result.profile.scene = { label: linkedService ? t.serviceScene : linked.length ? t.exchange : t.cues,
        evidence: ids(evidence) };
    } else if (requests.length) {
      result.profile.scene = { label: t.requestScene, evidence: ids(requests) };
      result.links.push(t.request(ids(requests).join(', ')));
    }

    const high = rows.filter(row => usable(row) && highFinancePattern.test(rowText(row)));
    const medium = rows.filter(row => usable(row) && mediumFinancePattern.test(rowText(row)));
    if (high.length || medium.length) {
      result.profile.financial_sensitivity = { label: high.length ? t.high : t.medium,
        evidence: ids(high.length ? high : medium) };
    } else if (verified.length) {
      result.profile.financial_sensitivity = { label: t.low,
        evidence: ids(verified.flatMap(group => [...group.rows, ...(group.request ? [group.request] : [])])) };
    }
    /* Keywords have no grammatical owner. Even age + number or an occupation
       word can refer to a third party; the local rules leave both unresolved. */
    result.links.push(t.limits);
    return result;
  }

  globalThis.PaintingUEngine = Object.freeze({ validateSegments, analyzeLocally });
})();
