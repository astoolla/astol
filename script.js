// سيتم نقل جميع أكواد الجافاسكريبت هنا لاحقاً

// --- START: Utility Function for Unique IDs ---
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
// --- END: Utility Function for Unique IDs ---

// --- START: Station Companies ---
const STATION_COMPANIES = {
    SHARARA: 'الشرارة',
    HIGHWAYS: 'الطرق السريعة',
    BREGA: 'البريقة',
    RAHILA: 'الراحلة',
    ALEMDAR: 'المدار الجديد',
    LIBYA_OIL: 'ليبيا للنفط',
    SPECIAL_ORDERS: 'طلبيات خاصة',
    OTHER: 'أخرى'
};
// --- END: Station Companies ---

// --- جلب السائقين من ووردبريس عبر AJAX ---
async function fetchDriversFromWP() {
    const res = await fetch(AstolAjax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=astol_get_drivers'
    });
    const data = await res.json();
    if(data.success) return data.data;
    else return [];
}

// --- إضافة سائق جديد عبر AJAX ---
async function addDriverToWP(driverObj) {
    const params = new URLSearchParams({ action: 'astol_add_driver', ...driverObj });
    const res = await fetch(AstolAjax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    return await res.json();
}

// --- حذف سائق عبر AJAX ---
async function deleteDriverFromWP(driverId) {
    const params = new URLSearchParams({ action: 'astol_delete_driver', id: driverId });
    const res = await fetch(AstolAjax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    return await res.json();
}

// --- تعديل بيانات سائق عبر AJAX ---
async function updateDriverInWP(driverObj) {
    const params = new URLSearchParams({ action: 'astol_update_driver', ...driverObj });
    const res = await fetch(AstolAjax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    return await res.json();
}

// --- استبدال منطق LocalStorage للسائقين بمنطق AJAX مع ووردبريس ---
async function renderDriversTable() {
    const tb = document.getElementById('driversTableBody');
    const st = document.getElementById('searchInput').value.toLowerCase();
    tb.innerHTML = '';
    const today = new Date(); today.setHours(0,0,0,0);
    const drivers = await fetchDriversFromWP();
    const fd = drivers.filter(d => Object.values(d).some(v => String(v).toLowerCase().includes(st)));
    if (fd.length === 0) {
        const r = tb.insertRow(); const c = r.insertCell(); c.colSpan = 14; c.textContent = 'لا يوجد سائقون.'; c.className = 'text-center py-4';
        return;
    }
    fd.forEach(d => {
        const r = tb.insertRow();
        // ...existing code for status and actions...
        const sc = r.insertCell();
        // يمكنك لاحقاً ربط getDriverDeliveryIndicator مع بيانات التوصيلات من ووردبريس
        sc.innerHTML = `<span class="status-dot status-green" title="-"></span>`;
        r.insertCell().textContent = d.rt; r.insertCell().textContent = d.permit_num; r.insertCell().textContent = d.driver_name;
        const pc = r.insertCell();
        let dpn = d.phone_number || 'غير محدد';
        if (d.phone_number && d.phone_number.trim() !== "") {
            let on = d.phone_number.trim(); let wn = ''; let tln = '';
            if (on.startsWith("09")) { const np = on.substring(1); dpn = "+218 " + np; wn = "218" + np; tln = "+218" + np; }
            else { dpn = on; wn = on.replace(/\D/g, ''); if (on.startsWith("+")) { tln = on; } else { tln = /^\d+$/.test(on.replace(/\s/g, '')) ? `+${on.replace(/\s/g, '')}` : on; }}
            pc.innerHTML = `<div class="flex items-center justify-end space-x-2"><span>${dpn}</span><a href="https://wa.me/${wn}" target="_blank" class="icon-btn whatsapp" title="واتساب"><i class="fab fa-whatsapp"></i></a><a href="tel:${tln}" class="icon-btn phone" title="اتصال"><i class="fas fa-phone"></i></a></div>`;
        } else { pc.innerHTML = `<div class="flex items-center justify-end space-x-2"><span>غير محدد</span></div>`; }
        r.insertCell().textContent = d.truck_num; r.insertCell().textContent = d.truck_type || '-'; r.insertCell().textContent = d.truck_color || '-';
        r.insertCell().textContent = d.product_type || '-'; r.insertCell().textContent = d.status || '-';
        r.insertCell().textContent = d.issue_date || '-'; r.insertCell().textContent = d.expiry_date || '-'; r.insertCell().textContent = d.trailer_num || '-';
        const ac = r.insertCell(); ac.className = 'flex items-center justify-end space-x-1 md:space-x-2';
        ac.innerHTML = `
            <button onclick="openEditDriverModal('${d.id}')" class="icon-btn text-yellow-500" title="تعديل"><i class="fas fa-edit"></i></button>
            <button onclick="deleteDriver('${d.id}')" class="icon-btn text-red-500" title="حذف"><i class="fas fa-trash-alt"></i></button>
            <button onclick="openLogDeliveryModal('${d.id}')" class="icon-btn text-green-500" title="تسجيل توصيل"><i class="fas fa-truck-loading"></i></button>
            <button onclick="viewDriverReport('${d.id}')" class="icon-btn text-purple-500" title="عرض الكشف"><i class="fas fa-history"></i></button>`;
    });
}

// --- إضافة سائق جديد (استبدال الدالة القديمة) ---
async function addDriver() {
    const rt = document.getElementById('newRt').value.trim();
    const pNum = document.getElementById('newPermitNum').value.trim();
    const dName = document.getElementById('newDriverName').value.trim();
    const tNum = document.getElementById('newTruckNum').value.trim();
    if (!rt || !pNum || !dName || !tNum) {
        showMessage("رت، رقم التصريح، اسم السائق، ورقم الشاحنة إلزامية.", "error");
        return;
    }
    const driverObj = {
        rt,
        permit_num: pNum,
        driver_name: dName,
        phone_number: document.getElementById('newPhoneNumber').value.trim(),
        truck_num: tNum,
        truck_type: document.getElementById('newTruckType').value.trim(),
        truck_color: document.getElementById('newTruckColor').value.trim(),
        product_type: document.getElementById('newProductType').value.trim(),
        status: document.getElementById('newStatus').value.trim(),
        issue_date: document.getElementById('newIssueDate').value.trim(),
        expiry_date: document.getElementById('newExpiryDate').value.trim(),
        trailer_num: document.getElementById('newTrailerNum').value.trim()
    };
    const res = await addDriverToWP(driverObj);
    if(res.success) {
        showMessage("تمت إضافة سائق جديد.", "success");
        ['newRt', 'newPermitNum', 'newDriverName', 'newPhoneNumber', 'newTruckNum', 'newTruckType', 'newTruckColor', 'newProductType', 'newStatus', 'newIssueDate', 'newExpiryDate', 'newTrailerNum'].forEach(id => document.getElementById(id).value = '');
        renderDriversTable();
    } else {
        showMessage("حدث خطأ أثناء الإضافة.", "error");
    }
}

// --- حذف سائق (استبدال الدالة القديمة) ---
async function deleteDriver(id) {
    if (confirm("هل أنت متأكد من حذف هذا السائق وجميع سجلاته؟")) {
        const res = await deleteDriverFromWP(id);
        if(res.success) {
            showMessage("تم حذف السائق.", "success");
            renderDriversTable();
        } else {
            showMessage("حدث خطأ أثناء الحذف.", "error");
        }
    }
}

// --- تعديل بيانات سائق (استبدال الدالة القديمة) ---
async function saveDriverChanges() {
    const id = document.getElementById('editDriverId').value;
    const ud = { id };
    ['Rt', 'PermitNum', 'DriverName', 'PhoneNumber', 'TruckNum', 'TruckType', 'TruckColor', 'ProductType', 'Status', 'IssueDate', 'ExpiryDate', 'TrailerNum'].forEach(f => {
        ud[f.charAt(0).toLowerCase() + f.slice(1)] = document.getElementById(`edit${f}`).value.trim();
    });
    if (!ud.rt || !ud.permitNum || !ud.driverName || !ud.truckNum) {
        showMessage("رت، رقم التصريح، اسم السائق، ورقم الشاحنة إلزامية.", "error");
        return;
    }
    // تحويل المفاتيح إلى snake_case كما في ووردبريس
    const driverObj = {
        id: ud.id,
        rt: ud.rt,
        permit_num: ud.permitNum,
        driver_name: ud.driverName,
        phone_number: ud.phoneNumber,
        truck_num: ud.truckNum,
        truck_type: ud.truckType,
        truck_color: ud.truckColor,
        product_type: ud.productType,
        status: ud.status,
        issue_date: ud.issueDate,
        expiry_date: ud.expiryDate,
        trailer_num: ud.trailerNum
    };
    const res = await updateDriverInWP(driverObj);
    if(res.success) {
        showMessage("تم حفظ تغييرات السائق.", "success");
        renderDriversTable();
        closeModal('editDriverModal');
    } else {
        showMessage("حدث خطأ أثناء الحفظ.", "error");
    }
}

// --- جلب المحطات من ووردبريس عبر AJAX ---
async function fetchStationsFromWP() {
    const res = await fetch(AstolAjax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=astol_get_stations'
    });
    const data = await res.json();
    if(data.success) return data.data;
    else return [];
}

// --- إضافة محطة جديدة عبر AJAX ---
async function addStationToWP(stationObj) {
    const params = new URLSearchParams({ action: 'astol_add_station', ...stationObj });
    const res = await fetch(AstolAjax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    return await res.json();
}

// --- حذف محطة عبر AJAX ---
async function deleteStationFromWP(stationId) {
    const params = new URLSearchParams({ action: 'astol_delete_station', id: stationId });
    const res = await fetch(AstolAjax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    return await res.json();
}

// --- تعديل بيانات محطة عبر AJAX ---
async function updateStationInWP(stationObj) {
    const params = new URLSearchParams({ action: 'astol_update_station', ...stationObj });
    const res = await fetch(AstolAjax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    return await res.json();
}

// --- جلب التوصيلات من ووردبريس عبر AJAX ---
async function fetchDeliveriesFromWP() {
    const res = await fetch(AstolAjax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=astol_get_deliveries'
    });
    const data = await res.json();
    if(data.success) return data.data;
    else return [];
}

// --- إضافة توصيل جديد عبر AJAX ---
async function addDeliveryToWP(deliveryObj) {
    const params = new URLSearchParams({ action: 'astol_add_delivery', ...deliveryObj });
    const res = await fetch(AstolAjax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    return await res.json();
}

// --- حذف توصيل عبر AJAX ---
async function deleteDeliveryFromWP(deliveryId) {
    const params = new URLSearchParams({ action: 'astol_delete_delivery', id: deliveryId });
    const res = await fetch(AstolAjax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    return await res.json();
}

// --- تعديل بيانات توصيل عبر AJAX ---
async function updateDeliveryInWP(deliveryObj) {
    const params = new URLSearchParams({ action: 'astol_update_delivery', ...deliveryObj });
    const res = await fetch(AstolAjax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    return await res.json();
}

// --- استبدال منطق LocalStorage للمحطات بمنطق AJAX مع ووردبريس ---
async function renderFuelStationsTable() {
    const tableBody = document.getElementById('fuelStationsTableBody');
    const searchTerm = document.getElementById('searchStationInput').value.toLowerCase();
    tableBody.innerHTML = '';
    const fuelStations = await fetchStationsFromWP();
    const filteredStations = fuelStations.filter(s =>
        (s.station_name || '').toLowerCase().includes(searchTerm) ||
        (s.station_number && s.station_number.toLowerCase().includes(searchTerm)) ||
        (s.company && s.company.toLowerCase().includes(searchTerm)) ||
        (s.address && s.address.toLowerCase().includes(searchTerm))
    );
    if (filteredStations.length === 0) {
        const r = tableBody.insertRow(); const c = r.insertCell(); c.colSpan = 5; c.textContent = 'لا توجد محطات.'; c.className = 'text-center py-4';
        return;
    }
    filteredStations.forEach(s => {
        const r = tableBody.insertRow();
        r.insertCell().textContent = s.station_name;
        r.insertCell().textContent = s.station_number || '-';
        r.insertCell().textContent = s.company;
        r.insertCell().textContent = s.address || '-';
        const ac = r.insertCell(); ac.className = 'flex items-center justify-end space-x-1 md:space-x-2';
        ac.innerHTML = `
            <button onclick="openEditStationModal('${s.id}')" class="icon-btn text-yellow-500" title="تعديل"><i class="fas fa-edit"></i></button>
            <button onclick="deleteFuelStation('${s.id}')" class="icon-btn text-red-500" title="حذف"><i class="fas fa-trash-alt"></i></button>
            <button onclick="viewStationReport('${s.id}')" class="icon-btn text-teal-500" title="عرض الكشف"><i class="fas fa-file-alt"></i></button>`;
    });
}

// --- إضافة محطة جديدة (استبدال الدالة القديمة) ---
async function addFuelStation() {
    const name = document.getElementById('newStationName').value.trim();
    const number = document.getElementById('newStationNumber').value.trim();
    const company = document.getElementById('newStationCompany').value;
    const address = document.getElementById('newStationAddress').value.trim();
    if (!name || !company) {
        showMessage("اسم المحطة والشركة مطلوبان.", "error");
        return;
    }
    const stationObj = {
        station_name: name,
        station_number: number,
        company: company,
        address: address
    };
    const res = await addStationToWP(stationObj);
    if(res.success) {
        showMessage("تمت إضافة محطة وقود جديدة بنجاح.", "success");
        ['newStationName', 'newStationNumber', 'newStationCompany', 'newStationAddress'].forEach(id => document.getElementById(id).value = '');
        renderFuelStationsTable();
    } else {
        showMessage("حدث خطأ أثناء الإضافة.", "error");
    }
}

// --- حذف محطة (استبدال الدالة القديمة) ---
async function deleteFuelStation(id) {
    if (confirm("هل أنت متأكد من حذف هذه المحطة وجميع سجلات التوصيل المرتبطة بها؟")) {
        const res = await deleteStationFromWP(id);
        if(res.success) {
            showMessage("تم حذف المحطة.", "success");
            renderFuelStationsTable();
        } else {
            showMessage("حدث خطأ أثناء الحذف.", "error");
        }
    }
}

// --- تعديل بيانات محطة (استبدال الدالة القديمة) ---
async function saveStationChanges() {
    const id = document.getElementById('editStationId').value;
    const name = document.getElementById('editStationName').value.trim();
    const company = document.getElementById('editStationCompany').value;
    if (!name || !company) {
        showMessage("اسم المحطة والشركة مطلوبان.", "error");
        return;
    }
    const stationObj = {
        id: id,
        station_name: name,
        station_number: document.getElementById('editStationNumber').value.trim(),
        company: company,
        address: document.getElementById('editStationAddress').value.trim()
    };
    const res = await updateStationInWP(stationObj);
    if(res.success) {
        showMessage("تم حفظ تغييرات المحطة.", "success");
        renderFuelStationsTable();
        closeModal('editStationModal');
    } else {
        showMessage("حدث خطأ أثناء الحفظ.", "error");
    }
}

// --- استبدال منطق LocalStorage للتوصيلات بمنطق AJAX مع ووردبريس ---
async function renderDeliveriesTable() {
    // هذه الدالة يمكن استخدامها لعرض التوصيلات في أي جدول حسب الحاجة
    // مثال: const deliveries = await fetchDeliveriesFromWP();
}

// --- إضافة توصيل جديد (استبدال الدالة القديمة) ---
async function saveDeliveryLog() {
    const driverId = document.getElementById('logDeliveryDriverId').value;
    const stationId = document.getElementById('selectedStationIdForDelivery').value;
    const notificationNumber = document.getElementById('deliveryNotificationNumber').value.trim();
    const date = document.getElementById('deliveryDate').value;
    const fuelType = document.getElementById('deliveryFuelType').value;
    let quantity;
    const quantitySelector = document.getElementById('deliveryFuelQuantity');
    if (quantitySelector.value === 'custom') {
        quantity = parseInt(document.getElementById('customFuelQuantity').value, 10);
    } else {
        quantity = parseInt(quantitySelector.value, 10);
    }
    if (!driverId || !stationId || !date || !fuelType || !quantity || isNaN(quantity) || quantity <= 0) {
        showMessage("يرجى ملء جميع الحقول واختيار محطة والتأكد من الكمية.", "error");
        return;
    }
    const deliveryObj = {
        driver_id: driverId,
        station_id: stationId,
        date: date,
        fuel_type: fuelType,
        quantity: quantity,
        notification_number: notificationNumber
    };
    const res = await addDeliveryToWP(deliveryObj);
    if(res.success) {
        showMessage("تم تسجيل التوصيل بنجاح.", "success");
        closeModal('logDeliveryModal');
        // يمكنك إعادة تحميل الجداول أو التقارير هنا
    } else {
        showMessage("حدث خطأ أثناء الإضافة.", "error");
    }
}

// --- حذف توصيل (استبدال الدالة القديمة) ---
async function deleteDeliveryLog(logId, reportTypeToRefresh = null, idToRefresh = null) {
    if (confirm("هل أنت متأكد من حذف سجل التوصيل هذا؟")) {
        const res = await deleteDeliveryFromWP(logId);
        if(res.success) {
            showMessage("تم حذف سجل التوصيل.", "success");
            // يمكنك إعادة تحميل الجداول أو التقارير هنا
        } else {
            showMessage("حدث خطأ أثناء الحذف.", "error");
        }
    }
}

// --- تعديل بيانات توصيل (استبدال الدالة القديمة) ---
async function saveDeliveryLogChanges() {
    const logId = document.getElementById('editDeliveryLogId').value;
    const stationId = document.getElementById('editSelectStationForDelivery').value;
    const notificationNumber = document.getElementById('editDeliveryNotificationNumber').value.trim();
    const date = document.getElementById('editDeliveryDate').value;
    const fuelType = document.getElementById('editDeliveryFuelType').value;
    let quantity;
    const qSel = document.getElementById('editDeliveryFuelQuantity');
    if (qSel.value === 'custom') { quantity = parseInt(document.getElementById('editCustomFuelQuantity').value, 10); }
    else { quantity = parseInt(qSel.value, 10); }
    if (!stationId || !date || !fuelType || !quantity || isNaN(quantity) || quantity <= 0) {
        showMessage("يرجى ملء جميع حقول التعديل بشكل صحيح.", "error");
        return;
    }
    const deliveryObj = {
        id: logId,
        station_id: stationId,
        date: date,
        fuel_type: fuelType,
        quantity: quantity,
        notification_number: notificationNumber
    };
    const res = await updateDeliveryInWP(deliveryObj);
    if(res.success) {
        showMessage("تم حفظ تعديلات التوصيل.", "success");
        closeModal('editDeliveryLogModal');
        // يمكنك إعادة تحميل الجداول أو التقارير هنا
    } else {
        showMessage("حدث خطأ أثناء الحفظ.", "error");
    }
}

// --- تحديث دوال التقارير لجلب البيانات من ووردبريس ---
async function getAllDrivers() {
    return await fetchDriversFromWP();
}
async function getAllStations() {
    return await fetchStationsFromWP();
}
async function getAllDeliveries() {
    return await fetchDeliveriesFromWP();
}

// مثال: تحديث دالة generateAndDisplayPeriodicReport لتستخدم البيانات من ووردبريس
async function generateAndDisplayPeriodicReport() {
    const rt = document.getElementById('reportType').value;
    const cf = document.getElementById('reportCompanyFilter').value;
    const ra = document.getElementById('periodicReportContentArea');
    ra.innerHTML = '';
    const rth4 = document.createElement('h4'); rth4.className = 'text-xl font-semibold mb-4 text-center text-blue-600';
    let fpd; let ptp;
    const deliveries = await getAllDeliveries();
    const stations = await getAllStations();
    if (rt === 'weekly') {
        const wv = document.getElementById('reportWeek').value; if (!wv) { showMessage("يرجى اختيار الأسبوع.", "error"); ra.innerHTML = '<p class="text-center py-4">يرجى اختيار الأسبوع.</p>'; document.getElementById('printPeriodicReportBtn').disabled = true; return; }
        const [sds, eds] = wv.split('_'); const sd = new Date(sds); sd.setHours(0,0,0,0); const ed = new Date(eds); ed.setHours(23,59,59,999);
        fpd = deliveries.filter(l => { const ld = new Date(l.date); return ld >= sd && ld <= ed; });
        ptp = `لـ${document.getElementById('reportWeek').options[document.getElementById('reportWeek').selectedIndex].text.replace("الأسبوع ","اسبوع ")}`;
        rth4.textContent = `الكشف الأسبوعي ${ptp}`;
    } else {
        const sm = parseInt(document.getElementById('reportMonth').value); const sy = parseInt(document.getElementById('reportYear').value);
        fpd = deliveries.filter(l => { const ld = new Date(l.date); return ld.getFullYear() === sy && ld.getMonth() === sm; });
        const mn = document.getElementById('reportMonth').options[document.getElementById('reportMonth').selectedIndex].text;
        ptp = `لشهر ${mn} ${sy}`; rth4.textContent = `الكشف الشهري - ${mn} ${sy}`;
    }
    ra.appendChild(rth4);
    if (cf !== 'all') { const fn = document.createElement('p'); fn.textContent = `شركة: ${cf}`; fn.className = 'text-md mb-3 text-center'; ra.appendChild(fn); }
    const tbl = document.createElement('table'); tbl.className = 'min-w-full bg-white border';
    const thd = tbl.createTHead(); const hr = thd.insertRow();
    ["المحطة", "الشركة", "التوصيلات", "بنزين(لتر)", "ديزل(لتر)", "الإجمالي(لتر)"].forEach(t => { const th = document.createElement('th'); th.textContent = t; th.className = 'p-3 border-b bg-slate-100'; hr.appendChild(th); });
    const tbd = tbl.createTBody(); let gtd=0, gtp=0, gtdsl=0, gtol=0;
    const str = stations.filter(s => cf === 'all' || s.company === cf);
    if (str.length === 0 && cf !== 'all') { ra.innerHTML += '<p class="text-center py-4">لا توجد محطات للفلتر.</p>'; document.getElementById('printPeriodicReportBtn').disabled = true; return; }
    let fdr = false;
    str.forEach(s => {
        const ssd = fpd.filter(l => l.station_id == s.id);
        if (ssd.length > 0) {
            fdr = true; const r = tbd.insertRow(); r.insertCell().textContent = s.station_name; r.insertCell().textContent = s.company;
            const nd = ssd.length; r.insertCell().textContent = nd.toLocaleString('ar-EG-u-nu-latn'); gtd += nd;
            const pq = ssd.filter(l=>l.fuel_type==='بنزين').reduce((sm,l)=>sm+parseInt(l.quantity||0),0); r.insertCell().textContent=pq.toLocaleString('ar-EG-u-nu-latn'); gtp+=pq;
            const dq = ssd.filter(l=>l.fuel_type==='ديزل').reduce((sm,l)=>sm+parseInt(l.quantity||0),0); r.insertCell().textContent=dq.toLocaleString('ar-EG-u-nu-latn'); gtdsl+=dq;
            const tq = pq + dq; r.insertCell().textContent = tq.toLocaleString('ar-EG-u-nu-latn'); gtol += tq;
        }
    });
    if (!fdr) { const r=tbd.insertRow();const c=r.insertCell();c.colSpan=6;c.className='text-center p-4';c.textContent='لا توجد توصيلات للفترة/الفلتر.';ra.appendChild(tbl);document.getElementById('printPeriodicReportBtn').disabled=true;return;}
    const tft = tbl.createTFoot(); const fr = tft.insertRow(); fr.className = 'bg-slate-200 font-bold';
    const tc1 = fr.insertCell(); tc1.textContent = "الإجمالي العام"; tc1.colSpan = 2;
    fr.insertCell().textContent=gtd.toLocaleString('ar-EG-u-nu-latn'); fr.insertCell().textContent=gtp.toLocaleString('ar-EG-u-nu-latn');
    fr.insertCell().textContent=gtdsl.toLocaleString('ar-EG-u-nu-latn'); fr.insertCell().textContent=gtol.toLocaleString('ar-EG-u-nu-latn');
    ra.appendChild(tbl); document.getElementById('printPeriodicReportBtn').disabled = false; showMessage("تم إنشاء الكشف.", "info");
}
// ...existing code...
// --- END: Initialization ---
