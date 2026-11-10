/* Local-only SheetJS worker. Parsing never executes formulas or loads links. */
importScripts("/vendor/xlsx.full.min.js");
self.onmessage = ({ data }) => {
  try {
    const workbook = XLSX.read(data.buffer, {
      type: "array",
      raw: true,
      codepage: 65001,
      cellDates: false,
      sheetRows: 2002,
      dense: true,
      cellFormula: false,
      bookVBA: false,
    });
    const name = data.sheet || workbook.SheetNames[0];
    if (!workbook.Sheets[name]) throw new Error("Select a worksheet.");
    const fullRange = workbook.Sheets[name]["!fullref"];
    if (fullRange && XLSX.utils.decode_range(fullRange).e.r > 2000)
      throw new Error(
        "Split worksheets longer than 2,000 data rows before importing.",
      );
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
      header: 1,
      raw: true,
      defval: "",
      blankrows: false,
    });
    if (rows.length < 2 || rows.length > 2001)
      throw new Error("Use a header row and between 1 and 2,000 data rows.");
    self.postMessage({
      sheets: workbook.SheetNames,
      sheet: name,
      rows,
      date1904: !!workbook.Workbook?.WBProps?.date1904,
    });
  } catch (error) {
    self.postMessage({
      error: "Could not read this statement: " + error.message,
    });
  }
};
