import ExcelJS from 'exceljs';
import { connectToDatabase } from '@/lib/mongodb';
import { getCoalModel } from '@/lib/models';

export async function GET(req) {
  try {
    await connectToDatabase();
    const Coal = getCoalModel();

    const { searchParams } = new URL(req.url);
    const includeData = String(searchParams.get('includeData') || '').toLowerCase() === 'true';

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Coal Upload Template');

    const instructionText = `Instructions:
1) Row 2 is headers. Required header: "Coal".
2) Optional header: "Coal ID" (or "Coal Source ID") to supply your own IDs.
3) Other example headers: SiO2, Al2O3, Fe2O3, CaO, MgO, Na2O, K2O, TiO2, SO3, P2O5, Mn3O4, Sulphur, GCV, Cost, Transport ID, Shipment date.`;
    worksheet.mergeCells('A1:R1');
    const instructionCell = worksheet.getCell('A1');
    instructionCell.value = instructionText;
    instructionCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    worksheet.getRow(1).height = 80;

    const headers = [
      'Coal ID', 'Coal', 'SiO2', 'Al2O3', 'Fe2O3', 'CaO', 'MgO', 'Na2O', 'K2O',
      'TiO2', 'SO3', 'P2O5', 'Mn3O4', 'SulphurS', 'gcv', 'Cost',
    ];
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(2);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };

    headers.forEach((_, i) => (worksheet.getColumn(i + 1).width = 18));

    if (includeData) {
      const docs = await Coal.find({}, { __v: 0 }).lean().exec();
      function pick(o, ...keys) {
        for (const k of keys) if (o && o[k] !== undefined && o[k] !== null) return o[k];
        return '';
      }
      for (const d of docs) {
        const rowValues = [
          pick(d, 'coalId', 'Coal ID'),
          pick(d, 'coal', 'Coal', 'name'),
          pick(d, 'SiO2'), pick(d, 'Al2O3'), pick(d, 'Fe2O3'), pick(d, 'CaO'), pick(d, 'MgO'),
          pick(d, 'Na2O'), pick(d, 'K2O'), pick(d, 'TiO2'), pick(d, 'SO3'), pick(d, 'P2O5'),
          pick(d, 'Mn3O4'), pick(d, 'Sulphur', 'S'), pick(d, 'GCV'), pick(d, 'cost'),
        ];
        worksheet.addRow(rowValues);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = includeData ? 'Coal_Data_Export.xlsx' : 'Coal_Upload_Template.xlsx';

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename=${filename}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (err) {
    console.error('/download-template error:', err);
    return new Response('Template generation failed', { status: 500 });
  }
}
