/**
 * běhna 2‰ — signup collector
 * Paste this into the Apps Script editor of a Google Sheet
 * (Extensions → Apps Script), then Deploy → New deployment → Web app.
 * See README.md for the full step-by-step.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // avoid two people writing the same row at once
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Add a header row the first time.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Jméno", "Odpověď", "User agent"]);
    }

    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      new Date(),
      String(data.name || "").slice(0, 100),
      String(data.choice || ""),
      String(data.ua || "").slice(0, 300),
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the /exec URL in a browser to confirm it's alive.
function doGet() {
  return ContentService.createTextOutput("běhna signup endpoint is running.");
}
