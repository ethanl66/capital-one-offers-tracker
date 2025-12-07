javascript:(function(){
    /* 1. Create the input overlay */
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;justify-content:center;align-items:center;flex-direction:column;font-family:sans-serif;';
    
    var container = document.createElement('div');
    container.style.cssText = 'background:white;padding:20px;border-radius:8px;width:80%;max-width:600px;box-shadow:0 4px 6px rgba(0,0,0,0.1);';
    
    var title = document.createElement('h3');
    title.innerText = 'Paste JSON Data';
    title.style.marginBottom = '10px';
    
    var textarea = document.createElement('textarea');
    textarea.placeholder = 'Paste the content of your data file here...';
    textarea.style.cssText = 'width:100%;height:300px;margin-bottom:15px;border:1px solid #ccc;padding:10px;font-family:monospace;';
    
    var btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '10px';
    
    var btnGo = document.createElement('button');
    btnGo.innerText = 'Merge Data';
    btnGo.style.cssText = 'padding:10px 20px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;';
    
    var btnClose = document.createElement('button');
    btnClose.innerText = 'Close';
    btnClose.style.cssText = 'padding:10px 20px;background:#6c757d;color:white;border:none;border-radius:4px;cursor:pointer;';
    
    btnContainer.appendChild(btnGo);
    btnContainer.appendChild(btnClose);
    container.appendChild(title);
    container.appendChild(textarea);
    container.appendChild(btnContainer);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    /* Close action */
    btnClose.onclick = function(){ document.body.removeChild(overlay); };

    /* Process action */
    btnGo.onclick = function(){
        try {
            var jsonData = JSON.parse(textarea.value);
            processData(jsonData);
            document.body.removeChild(overlay);
        } catch(e) {
            alert('Error parsing JSON: ' + e.message);
        }
    };

    function processData(data) {
        /* 2. Build Lookup Map with Priority Logic */
        var map = {};
        data.forEach(function(item){
            var tid = item.tripId;
            if(!tid) return;
            
            /* Logic: If new ID, add it. If existing ID has null amount but new one has value, overwrite. */
            if (!map[tid]) {
                map[tid] = item;
            } else {
                if (map[tid].orderAmount === null && item.orderAmount !== null) {
                    map[tid] = item;
                }
            }
        });

        /* 3. Modify HTML Table */
        var table = document.querySelector('table');
        if(!table) return alert('Table not found on this page.');
        
        /* Add Headers */
        var theadRow = table.querySelector('thead tr');
        var thTemplate = theadRow.children[1].cloneNode(true); /* Clone existing TH for style */
        
        ['Status (API)', 'Order Amt (API)', 'Credit Amt (API)'].forEach(function(headerTitle){
            var th = thTemplate.cloneNode(true);
            /* Try to find the inner text container to preserve structure */
            var textNode = th.querySelector('h4') || th;
            textNode.innerText = headerTitle;
            theadRow.appendChild(th);
        });

        /* Add Data Rows */
        var tbodyRows = table.querySelectorAll('tbody tr');
        var cellTemplate = tbodyRows[0].children[1].cloneNode(true); /* Clone existing TD for style */

        tbodyRows.forEach(function(row){
            var cells = row.querySelectorAll('td');
            if(cells.length < 5) return;
            
            /* Trip ID is in the 5th column (index 4) */
            var tripId = cells[4].innerText.trim();
            var entry = map[tripId];
            
            var status = entry ? entry.status : '-';
            var orderAmt = (entry && entry.orderAmount !== null) ? '$' + entry.orderAmount : '-';
            var creditAmt = (entry && entry.creditAmount !== null) ? '$' + entry.creditAmount : '-';
            
            [status, orderAmt, creditAmt].forEach(function(val){
                var td = cellTemplate.cloneNode(true);
                td.innerText = val;
                row.appendChild(td);
            });
        });
    }
})();