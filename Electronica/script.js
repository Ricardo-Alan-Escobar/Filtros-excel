document.getElementById('fileInput').addEventListener('change', function() {
    const fileName = this.files[0]?.name || 'Ningún archivo seleccionado';
    document.getElementById('fileName').textContent = fileName;
});
document.getElementById('filterButton').addEventListener('click', () => {
    const fileInput = document.getElementById('fileInput');
    const cfdiFilterValue = document.getElementById('cfdiFilter').value;
    const tipoFiltroValue = document.getElementById('tipoFiltro').value;

    if (fileInput.files.length === 0) {
        alert('Por favor, sube un archivo Excel.');
        return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const productosElectronicos = [
                'Celular', 'Tablet', 'Toner', 'Laptop', 'Computadora', 
                'Pantalla', 'Teclado', 'Ratón', 'Impresora', 'Router', 'Telecomunicaciones',
                'Modem', 'Disco Duro', 'Memoria USB',  'swhich', 'tinta','cartucho',
                'Cargador', 'Batería', 'Auriculares', 'Altavoz', 'Micrófono',
                'Cámara', 'Proyector', 'Joystick', 'impresora',
                'TV', 'Cable HDMI', 'Adaptador', 'Fuente de poder', 'utp',
                 'Procesador', 'software',
                 'Funda', 'Soporte'
            ];

            let filteredData = jsonData.filter(row => {
                let matchesCFDI = !cfdiFilterValue || row.UsoCFDI === cfdiFilterValue;
                let matchesTipo = tipoFiltroValue === 'Todos' || row.Tipo === tipoFiltroValue;

                if (matchesCFDI && matchesTipo && row.Conceptos) {
                    return productosElectronicos.some(producto => row.Conceptos.toLowerCase().includes(producto.toLowerCase()));
                }
                return false;
            }).map(row => ({
                'RFC Emisor': row['RFC Emisor'],
                'Nombre Emisor': row['Nombre Emisor'],
                'Tipo': row['Tipo'],
                'UsoCFDI': row['UsoCFDI'], 
                'Concepto': row['Conceptos'],
                'Total': parseFloat(row['Total']) || 0
            }));

            let totalSum = filteredData.reduce((sum, row) => sum + (row['Total'] || 0), 0);

            const tableBody = document.querySelector('#dataTable tbody');
            tableBody.innerHTML = '';
            filteredData.forEach((row, index) => {
                const tr = document.createElement('tr');
                Object.values(row).forEach(cell => {
                    const td = document.createElement('td');
                    td.textContent = cell;
                    tr.appendChild(td);
                });

                const tdDelete = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteButton.classList.add('btn-delete');
                deleteButton.addEventListener('click', () => {
                    totalSum -= row['Total']; 
                    document.getElementById('totalSum').textContent = totalSum.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
                    tr.remove();
                    filteredData.splice(index, 1);
                });
                tdDelete.appendChild(deleteButton);
                tr.appendChild(tdDelete);

                tableBody.appendChild(tr);
            });

            const trTotal = document.createElement('tr');
            const tdTotal = document.createElement('td');
            tdTotal.colSpan = 2;
            tdTotal.textContent = 'Total';
            trTotal.appendChild(tdTotal);
            const tdTotalValue = document.createElement('td');
            tdTotalValue.textContent = totalSum.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
            tdTotalValue.id = 'totalSum'; 
            trTotal.appendChild(tdTotalValue);
            tableBody.appendChild(trTotal);

            const ws = XLSX.utils.json_to_sheet(filteredData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Filtrado');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);

            let downloadLink = document.getElementById('downloadLink');
            if (!downloadLink) {
                downloadLink = document.createElement('a');
                downloadLink.id = 'downloadLink';
                downloadLink.innerHTML = '<i class="fa-solid fa-download"></i> Descargar Datos Filtrados';
                downloadLink.style.display = 'block';
                downloadLink.style.marginTop = '20px';
                document.querySelector('.data-section').appendChild(downloadLink);
            }
            downloadLink.href = url;
            downloadLink.download = 'datos_filtrados.xlsx';
        } catch (error) {
            console.error('Error al procesar el archivo:', error);
        }
    };

    reader.onerror = (error) => {
        console.error('Error al leer el archivo:', error);
    };

    reader.readAsArrayBuffer(file);
});
