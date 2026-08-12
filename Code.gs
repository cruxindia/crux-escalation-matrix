/**
 * CRUX ESCALATION MATRIX — CONNECTIVITY SPIKE (Phase 2, pre-build)
 *
 * Purpose: empirically confirm how this Apps Script Web App behaves when
 * called cross-origin from a GitHub Pages frontend, BEFORE we build the
 * real API on top of it. Do not extend this file with real business logic —
 * once the spike results are in, this gets replaced by the real Code.gs
 * from Phase 6 (Email engine) / Phase 3 (Auth).
 *
 * Deployment settings required:
 *   Execute as: Me
 *   Who has access: Anyone
 */

// ---- Test 1: plain GET, JSON response (tests whether fetch() can read it cross-origin) ----
// ---- Test 2: same GET, but JSONP response if ?callback=xxx is present (reliable fallback) ----
function doGet(e) {
  var payload = {
    ok: true,
    message: 'GET reached Apps Script successfully.',
    receivedParams: e.parameter,
    serverTime: new Date().toISOString()
  };

  var callback = e.parameter.callback;

  if (callback) {
    // JSONP path — wraps the JSON in a function call, delivered as a <script> tag.
    // This bypasses CORS entirely because <script src="..."> is not subject to
    // same-origin policy. Only works for reads (GET), never for writes.
    var jsonpBody = callback + '(' + JSON.stringify(payload) + ');';
    return ContentService
      .createTextOutput(jsonpBody)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // Plain JSON path — this is what a normal fetch() GET will hit.
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Test 3: POST with text/plain content-type (dodges the CORS preflight, ----
// ---- but the actual body is still JSON-encoded text that we parse manually) ----
function doPost(e) {
  var parsed = {};
  var parseError = null;

  try {
    parsed = JSON.parse(e.postData.contents);
  } catch (err) {
    parseError = err.message;
  }

  var payload = {
    ok: !parseError,
    message: parseError ? 'POST reached Apps Script but body failed to parse.' : 'POST reached Apps Script and body parsed successfully.',
    receivedBody: parsed,
    contentType: e.postData ? e.postData.type : null,
    parseError: parseError,
    serverTime: new Date().toISOString()
  };

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
