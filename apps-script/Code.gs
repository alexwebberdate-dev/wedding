/**
 * Wedding RSVP receiver: paste into a Google Sheet's Apps Script editor
 * (Extensions → Apps Script) and deploy as a Web app. See README step 2.
 *
 * Each submission writes one row per guest. Rows from the same RSVP
 * share a Household ID so you can group or follow up by party.
 */

const SHEET_NAME = 'RSVPs';
const HEADERS = [
  'Submitted', 'Household ID', 'Attending', 'Guest name',
  'Meal', 'Dietary needs', 'Email', 'Message', 'Language'
];
const MAX_GUESTS = 20;

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getSheet_();
    const submitted = new Date();
    const household = Utilities.getUuid().slice(0, 8);
    const guests = Array.isArray(data.guests) && data.guests.length ? data.guests : [{}];

    const rows = guests.slice(0, MAX_GUESTS).map(g => [
      submitted,
      household,
      clean_(data.attending),
      clean_(g.name),
      clean_(g.meal),
      clean_(g.dietary),
      clean_(data.email),
      clean_(data.message),
      clean_(data.lang)
    ]);

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visit the web app URL in a browser to check that it's deployed.
function doGet() {
  return json_({ ok: true, message: 'RSVP endpoint is running.' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Trim length, and stop text starting with = + - @ from being run as a formula.
function clean_(value) {
  const s = String(value == null ? '' : value).slice(0, 1000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
