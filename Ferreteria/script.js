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

            const herramientas = [
                'Martillo', 'Masos', 'Cincel', 'Tuercas', 'Tornillos', 'Manguera',
                'Destornillador', 'Alicates', 'Llave inglesa', 'Sierra',
                'Cinta métrica', 'Serrucho', 'Brocas', 'Pinceles', 'Alicates de corte',
                'Rondana', 'Solera', 'Tubo', 'Escudo', 'Angulo',
                'Roscada', 'Arbol', 'Placa', 'Barra',
                'Lente', 'Disco', 'Tijera', 'Birela', 'Rodaja', 'Soldadura',
                'Llave de tubo', 'Nivel', 'Cepillo', 'Sargento', 'Escofina',
                'Taladro', 'Caladora', 'Amoladora', 'Remachadora', 'Engrapadora',
                'Espátula', 'Llave Allen', 'Llave de impacto', 'Corta tubos', 'Corta cables',
                'Compresor de aire', 'Tijeras para chapa', 'Taladro de banco', 'Aspiradora industrial',
                'Pistola de calor', 'Pulidora', 'Esmeril', 'Soplete', 'Clavos',
                'Arandelas', 'Bisagras', 'Pasadores', 'Grilletes', 'Anclas',
                'Bridas', 'Grapas', 'Cinta aislante', 'Cinta de teflón',
                'Tornillos para madera', 'Tornillos para concreto',
                'Tornillos autorroscantes', 'Clavijas', 'Tacos de expansión', 'Cerraduras',
                'Candados', 'Cadenas', 'Cintas de seguridad', 'Llaves', 'Biseles', 'Aceite'
            ];

            const palabrasOmitir = [
                'servicio', 'Suministro', 'Alquiler', 'Fabricación', 'FABRICACION',
                'Colocación','Colocación', 'Renta', 'Aplicación', 'Proemo', 
                'Recubrimiento', 'Proyecto' , 'Mantenimiento', 'AFINACION', 'COLOCACION','BATERIA'
            ];

            let filteredData = jsonData.filter(row => {
                let matchesCFDI = !cfdiFilterValue || row.UsoCFDI === cfdiFilterValue;
                let matchesTipo = tipoFiltroValue === 'Todos' || row.Tipo === tipoFiltroValue;

                if (matchesCFDI && matchesTipo && row.Conceptos) {
                    let incluyePalabrasOmitir = palabrasOmitir.some(palabra => row.Conceptos.toLowerCase().includes(palabra.toLowerCase()));
                    if (!incluyePalabrasOmitir) {
                        return herramientas.some(herramienta => row.Conceptos.toLowerCase().includes(herramienta.toLowerCase()));
                    }
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
