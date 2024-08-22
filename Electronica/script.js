document.getElementById('fileInput').addEventListener('change', function() {
    const fileName = this.files[0]?.name || 'Ningún archivo seleccionado';
    document.getElementById('fileName').textContent = fileName;
});

document.getElementById('filterButton').addEventListener('click', () => {
    const fileInput = document.getElementById('fileInput');
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
            
            // Definir los productos electrónicos
            const productosElectronicos = [
                'Celular', 'Tablet', 'Toner', 'Laptop', 'Computadora', 
                'Pantalla', 'Teclado', 'Ratón', 'Impresora', 'Router', 
                'Modem', 'Disco Duro', 'Memoria USB', 'Cable', 'swhich', 'tinta','cartucho',
                'Cargador', 'Batería', 'Auriculares', 'Altavoz', 'Micrófono',
                 'Cámara', 'Proyector', 'Joystick', 'impresora',
                'TV', 'Cable HDMI', 'Adaptador', 'Fuente de poder', 
                 'Procesador', 'software',
                 'Funda', 'Soporte'
            ];

            // Filtrar datos: buscar palabras clave en la columna 'Conceptos'
            const filteredData = jsonData.filter(row => {
                if (row.Conceptos) {
                    return productosElectronicos.some(producto => row.Conceptos.toLowerCase().includes(producto.toLowerCase()));
                }
                return false;
            }).map(row => ({
                'RFC Emisor': row['RFC Emisor'],
                'RFC Receptor': row['RFC Receptor'],
                'Concepto': row['Conceptos'],
                'Total': parseFloat(row['Total']) || 0 // Total es un número
            }));
            
            // Calcular total de la columna 'Total'
            const totalSum = filteredData.reduce((sum, row) => sum + (row['Total'] || 0), 0);
            
            // Mostrar datos filtrados en la tabla
            const tableBody = document.querySelector('#dataTable tbody');
            tableBody.innerHTML = '';
            filteredData.forEach(row => {
                const tr = document.createElement('tr');
                Object.values(row).forEach(cell => {
                    const td = document.createElement('td');
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            });

            // Agregar fila de totales
            const trTotal = document.createElement('tr');
            const tdTotal = document.createElement('td');
            tdTotal.colSpan = 2; // Combinar celdas para el total
            tdTotal.textContent = 'Total';
            trTotal.appendChild(tdTotal);
            const tdTotalValue = document.createElement('td');
            tdTotalValue.textContent = totalSum.toFixed(2); // Formatear con 2 decimales
            trTotal.appendChild(tdTotalValue);
            tableBody.appendChild(trTotal);

            // Crear y mostrar el enlace para la descarga del archivo
            const ws = XLSX.utils.json_to_sheet(filteredData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Filtrado');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

            // Crear un enlace para la descarga del archivo
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);

            // Actualizar el enlace en la página
            let downloadLink = document.getElementById('downloadLink');
            if (!downloadLink) {
                downloadLink = document.createElement('a');
                downloadLink.id = 'downloadLink';
                downloadLink.textContent = 'Descargar Datos Filtrados';
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
