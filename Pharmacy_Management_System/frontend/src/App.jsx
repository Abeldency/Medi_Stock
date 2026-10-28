import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getMedicines, getDashboard, createMedicine, updateMedicine, updateStock, deleteMedicine,
} from "./api.js";

const CATEGORIES = ["General", "Analgesics", "Antibiotics", "Antiseptics", "Cardiac", "Diabetes care", "Digestive health", "First aid", "Vitamins & supplements", "Other"];
const emptyForm = { medicineId: "", name: "", manufacturer: "", category: "General", batchNumber: "", expiryDate: "", price: "", quantity: "", lowStockThreshold: 10 };
const money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(n) || 0);
const date = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function Icon({ name, className = "" }) { return <i aria-hidden="true" className={`bi bi-${name} ${className}`} />; }

function StatCard({ icon, label, value, note, tone }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon name={icon} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></article>;
}

function App() {
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats] = useState({ medicineTypes: 0, totalUnits: 0, lowStock: 0, inventoryValue: 0, expiringSoon: 0, expired: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [stockTarget, setStockTarget] = useState(null);
  const [stockAction, setStockAction] = useState("receive");
  const [stockAmount, setStockAmount] = useState("1");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async (term = "") => {
    setLoading(true);
    try {
      const [items, dashboard] = await Promise.all([getMedicines(term), getDashboard()]);
      setMedicines(items);
      setStats(dashboard);
      setLastUpdated(new Date());
    } catch (error) {
      setNotice({ type: "danger", text: `${error.message}. Check that the backend and MongoDB are running.` });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(""); }, [refresh]);
  useEffect(() => {
    const timer = setTimeout(() => refresh(search), 300);
    return () => clearTimeout(timer);
  }, [search, refresh]);

  const filteredMedicines = useMemo(() => medicines.filter((medicine) => {
    const low = medicine.quantity <= (medicine.lowStockThreshold ?? 10);
    const expired = medicine.expiryDate && new Date(medicine.expiryDate) < new Date(new Date().toDateString());
    const matchesStatus = statusFilter === "all" || (statusFilter === "low" && low) || (statusFilter === "out" && medicine.quantity === 0) || (statusFilter === "expired" && expired);
    const matchesCategory = categoryFilter === "all" || (medicine.category || "General") === categoryFilter;
    return matchesStatus && matchesCategory;
  }), [medicines, statusFilter, categoryFilter]);

  const lowStockItems = useMemo(() => medicines.filter(m => m.quantity <= (m.lowStockThreshold ?? 10)), [medicines]);

  function openAdd() { setEditing(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(medicine) {
    setEditing(medicine);
    setForm({ medicineId: medicine.medicineId, name: medicine.name, manufacturer: medicine.manufacturer, category: medicine.category || "General", batchNumber: medicine.batchNumber || "", expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().slice(0, 10) : "", price: medicine.price, quantity: medicine.quantity, lowStockThreshold: medicine.lowStockThreshold ?? 10 });
    setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditing(null); setForm(emptyForm); }

  async function submitMedicine(event) {
    event.preventDefault(); setBusy(true);
    try {
      const payload = { ...form, medicineId: form.medicineId.trim().toUpperCase(), name: form.name.trim(), manufacturer: form.manufacturer.trim(), batchNumber: form.batchNumber.trim(), price: Number(form.price), quantity: Number(form.quantity), lowStockThreshold: Number(form.lowStockThreshold), expiryDate: form.expiryDate || null };
      if (editing) await updateMedicine(editing._id, payload); else await createMedicine(payload);
      setNotice({ type: "success", text: editing ? "Medicine details updated successfully." : "Medicine added successfully." });
      closeForm(); await refresh(search);
    } catch (error) { setNotice({ type: "danger", text: error.message }); }
    finally { setBusy(false); }
  }

  async function submitStock(event) {
    event.preventDefault(); setBusy(true);
    try {
      await updateStock(stockTarget._id, stockAction, stockAmount);
      setNotice({ type: "success", text: stockAction === "receive" ? "Stock received successfully." : "Sale recorded successfully." });
      setStockTarget(null); await refresh(search);
    } catch (error) { setNotice({ type: "danger", text: error.message }); }
    finally { setBusy(false); }
  }

  async function removeMedicine(medicine) {
    if (!window.confirm(`Delete ${medicine.name} (${medicine.medicineId})? This action cannot be undone.`)) return;
    try { await deleteMedicine(medicine._id); setNotice({ type: "success", text: `${medicine.name} deleted successfully.` }); await refresh(search); }
    catch (error) { setNotice({ type: "danger", text: error.message }); }
  }

  function exportCsv() {
    const rows = [["Medicine ID", "Name", "Manufacturer", "Category", "Batch number", "Expiry date", "Unit price (INR)", "Quantity", "Low-stock threshold"], ...filteredMedicines.map(m => [m.medicineId, m.name, m.manufacturer, m.category || "General", m.batchNumber || "", m.expiryDate ? new Date(m.expiryDate).toISOString().slice(0, 10) : "", m.price, m.quantity, m.lowStockThreshold ?? 10])];
    const csv = rows.map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a"); link.href = url; link.download = `medistock-inventory-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  const updateField = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" aria-label="MediStock dashboard"><span className="brand-icon"><Icon name="capsule-pill" /></span><span><strong>MediStock</strong><small>PHARMACY OPERATIONS</small></span></a>
        <div className="nav-label">WORKSPACE</div>
        <a className="side-link active" href="#dashboard"><Icon name="grid-1x2-fill" /> Dashboard</a>
        <a className="side-link" href="#inventory"><Icon name="prescription2" /> Medicine inventory</a>
        <a className="side-link" href="#alerts"><Icon name="exclamation-triangle" /> Stock & expiry alerts {(stats.lowStock + stats.expiringSoon + stats.expired) > 0 && <span className="nav-count">{stats.lowStock + stats.expiringSoon + stats.expired}</span>}</a>
        <div className="sidebar-spacer" />
        <div className="sidebar-note"><div className="sidebar-note-icon"><Icon name="shield-check" /></div><strong>Inventory, under control.</strong><p>Keep records accurate and monitor stock before it runs low.</p><span><i className="status-dot" /> Local workspace</span></div>
        <div className="sidebar-footer">MediStock <span>•</span> Inventory management</div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="mobile-brand"><Icon name="capsule-pill" /> MediStock</div><div className="breadcrumb-text">Workspace <Icon name="chevron-right" /> <strong>Dashboard</strong></div><div className="topbar-right"><span className="system-status"><i className="status-dot" /> System workspace</span><span className="avatar">MS</span></div></header>
        <div className="page-content" id="dashboard">
          <div className="page-heading"><div><div className="eyebrow">OVERVIEW / INVENTORY</div><h1>Pharmacy dashboard</h1><p>A clear view of stock levels, product value and expiry risk.</p></div><button className="btn btn-primary-custom" onClick={openAdd}><Icon name="plus-lg" /> Add medicine</button></div>

          {notice && <div className={`notice notice-${notice.type}`} role="status"><Icon name={notice.type === "success" ? "check-circle-fill" : "exclamation-circle-fill"} /><span>{notice.text}</span><button onClick={() => setNotice(null)} aria-label="Dismiss notification"><Icon name="x-lg" /></button></div>}

          <section className="stats-grid" aria-label="Inventory summary">
            <StatCard icon="prescription2" label="Medicine types" value={Number(stats.medicineTypes || 0).toLocaleString("en-IN")} note="Unique inventory records" tone="teal" />
            <StatCard icon="boxes" label="Units in stock" value={Number(stats.totalUnits || 0).toLocaleString("en-IN")} note="Across all medicine records" tone="blue" />
            <StatCard icon="exclamation-triangle" label="Low-stock items" value={Number(stats.lowStock || 0).toLocaleString("en-IN")} note="At or below set threshold" tone="amber" />
            <StatCard icon="wallet2" label="Inventory value" value={money(stats.inventoryValue)} note="Unit price × available stock" tone="purple" />
          </section>

          <section className="quick-insights" aria-label="Expiry summary">
            <div className="insight-copy"><span className="insight-icon"><Icon name="calendar2-check" /></span><div><strong>Expiry monitoring</strong><p>Track products nearing expiry and avoid keeping expired stock in circulation.</p></div></div>
            <div className="insight-metrics"><div><span className="metric-number expired-text">{stats.expired || 0}</span><span>Expired</span></div><div><span className="metric-number expiring-text">{stats.expiringSoon || 0}</span><span>Expiring in 90 days</span></div></div>
          </section>

          <section className="panel" id="inventory">
            <div className="panel-heading"><div><div className="section-kicker">YOUR CATALOGUE</div><h2>Medicine inventory</h2><p>Search, review, update and export your medicine records.</p></div><span className="record-count">{filteredMedicines.length} {filteredMedicines.length === 1 ? "record" : "records"}</span></div>
            <div className="toolbar"><label className="search-box"><Icon name="search" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID or manufacturer..." aria-label="Search medicines" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><Icon name="x-lg" /></button>}</label><div className="toolbar-actions"><select className="form-select filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}</select><select className="form-select filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by stock status"><option value="all">All stock</option><option value="low">Low stock</option><option value="out">Out of stock</option><option value="expired">Expired</option></select><button className="btn btn-outline-custom" onClick={exportCsv} title="Export visible records to CSV"><Icon name="download" /> <span>Export</span></button><button className="btn btn-outline-custom refresh-btn" onClick={() => refresh(search)} title="Refresh inventory"><Icon name="arrow-clockwise" /></button></div></div>
            <div className="table-responsive"><table className="table inventory-table align-middle mb-0"><thead><tr><th>MEDICINE</th><th>ID / BATCH</th><th>CATEGORY</th><th>UNIT PRICE</th><th>QUANTITY</th><th>EXPIRY</th><th>STATUS</th><th className="text-end">ACTIONS</th></tr></thead><tbody>
              {loading ? <tr><td colSpan="8" className="table-message"><span className="spinner-border spinner-border-sm me-2" />Loading inventory...</td></tr> : filteredMedicines.length === 0 ? <tr><td colSpan="8"><div className="empty-state"><span className="empty-icon"><Icon name={search || statusFilter !== "all" || categoryFilter !== "all" ? "search" : "inbox"} /></span><strong>{search || statusFilter !== "all" || categoryFilter !== "all" ? "No matching medicines" : "Your inventory is ready for its first record"}</strong><span>{search || statusFilter !== "all" || categoryFilter !== "all" ? "Try adjusting the search or filters." : "Add medicine details to begin managing your catalogue."}</span>{!search && statusFilter === "all" && categoryFilter === "all" && <button className="btn btn-primary-custom btn-sm" onClick={openAdd}>Add first medicine</button>}</div></td></tr> : filteredMedicines.map(m => {
                const low = m.quantity <= (m.lowStockThreshold ?? 10);
                const expired = m.expiryDate && new Date(m.expiryDate) < new Date(new Date().toDateString());
                const expiring = m.expiryDate && !expired && new Date(m.expiryDate) <= new Date(Date.now() + 90 * 86400000);
                return <tr key={m._id}><td><div className="medicine-name"><span className="medicine-symbol"><Icon name="capsule" /></span><div><strong>{m.name}</strong><small>{m.manufacturer}</small></div></div></td><td><span className="id-chip">{m.medicineId}</span><small className="batch-label">{m.batchNumber ? `Batch ${m.batchNumber}` : "No batch recorded"}</small></td><td><span className="category-label">{m.category || "General"}</span></td><td className="price-cell">{money(m.price)}</td><td><strong className="quantity-value">{m.quantity}</strong><span className="unit-label"> units</span></td><td><span className={expired ? "expiry-date expired-text" : expiring ? "expiry-date expiring-text" : "expiry-date"}>{date(m.expiryDate)}</span></td><td><span className={`stock-badge ${m.quantity === 0 || expired ? "stock-danger" : low || expiring ? "stock-low" : "stock-good"}`}><span />{expired ? "Expired" : m.quantity === 0 ? "Out of stock" : low ? "Low stock" : expiring ? "Expiring soon" : "In stock"}</span></td><td><div className="action-buttons"><button className="action-btn stock-action" title="Receive stock or record sale" aria-label={`Manage stock for ${m.name}`} onClick={() => { setStockTarget(m); setStockAction("receive"); setStockAmount("1"); }}><Icon name="boxes" /></button><button className="action-btn" title="Edit medicine" aria-label={`Edit ${m.name}`} onClick={() => openEdit(m)}><Icon name="pencil-square" /></button><button className="action-btn delete-action" title="Delete medicine" aria-label={`Delete ${m.name}`} onClick={() => removeMedicine(m)}><Icon name="trash3" /></button></div></td></tr>;
              })}
            </tbody></table></div>
            <div className="table-footer"><span><Icon name="database-check" /> Inventory data saved in MongoDB</span><span>{lastUpdated ? `Last refreshed ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Waiting for data"}</span></div>
          </section>

          <section className="panel alerts-panel" id="alerts"><div className="panel-heading"><div><div className="section-kicker">ATTENTION REQUIRED</div><h2><Icon name="bell" className="heading-icon" /> Stock alerts</h2><p>Items that may need replenishment or expiry review.</p></div><span className={`record-count ${lowStockItems.length ? "warning-count" : ""}`}>{lowStockItems.length} low-stock</span></div>
            {lowStockItems.length === 0 ? <div className="all-good"><Icon name="check-circle-fill" /><span><strong>All stock levels look healthy.</strong> No medicines are currently at or below their low-stock threshold.</span></div> : <div className="alert-list">{lowStockItems.slice(0, 6).map(m => <div className="alert-item" key={m._id}><span className="alert-icon"><Icon name={m.quantity === 0 ? "x-octagon" : "exclamation-triangle"} /></span><div className="alert-medicine"><strong>{m.name}</strong><small>{m.medicineId} · Threshold {m.lowStockThreshold ?? 10} units</small></div><span className={`alert-qty ${m.quantity === 0 ? "qty-zero" : ""}`}>{m.quantity} left</span><button className="btn btn-sm alert-manage" onClick={() => { setStockTarget(m); setStockAction("receive"); setStockAmount("1"); }}>Manage stock</button></div>)}</div>}
          </section>
          <footer className="app-footer"><span>© {new Date().getFullYear()} MediStock Inventory Management</span><span>Built for accurate stock control <Icon name="heart-fill" /></span></footer>
        </div>
      </main>

      {showForm && <div className="modal-backdrop-custom" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) closeForm(); }}><section className="app-modal" role="dialog" aria-modal="true" aria-labelledby="medicine-modal-title"><div className="modal-head"><div><div className="section-kicker">MEDICINE CATALOGUE</div><h2 id="medicine-modal-title">{editing ? "Edit medicine details" : "Add a new medicine"}</h2><p>{editing ? "Update product information and stock thresholds." : "Add accurate medicine details to your inventory."}</p></div><button className="modal-close" onClick={closeForm} disabled={busy} aria-label="Close dialog"><Icon name="x-lg" /></button></div>
        <form onSubmit={submitMedicine}><div className="form-grid">
          <div className="form-field"><label htmlFor="medicineId">Medicine ID *</label><input id="medicineId" className="form-control" value={form.medicineId} onChange={e => updateField("medicineId", e.target.value)} placeholder="e.g. MED-001" required maxLength="40" disabled={busy} /></div>
          <div className="form-field"><label htmlFor="name">Medicine name *</label><input id="name" className="form-control" value={form.name} onChange={e => updateField("name", e.target.value)} placeholder="e.g. Paracetamol 500 mg" required maxLength="120" disabled={busy} /></div>
          <div className="form-field"><label htmlFor="manufacturer">Manufacturer *</label><input id="manufacturer" className="form-control" value={form.manufacturer} onChange={e => updateField("manufacturer", e.target.value)} placeholder="Manufacturer / supplier" required maxLength="120" disabled={busy} /></div>
          <div className="form-field"><label htmlFor="category">Category</label><select id="category" className="form-select" value={form.category} onChange={e => updateField("category", e.target.value)} disabled={busy}>{CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></div>
          <div className="form-field"><label htmlFor="batchNumber">Batch number <span>Optional</span></label><input id="batchNumber" className="form-control" value={form.batchNumber} onChange={e => updateField("batchNumber", e.target.value)} placeholder="e.g. BTH-24A" maxLength="60" disabled={busy} /></div>
          <div className="form-field"><label htmlFor="expiryDate">Expiry date <span>Optional</span></label><input id="expiryDate" className="form-control" type="date" min={editing ? undefined : today} value={form.expiryDate} onChange={e => updateField("expiryDate", e.target.value)} disabled={busy} /></div>
          <div className="form-field"><label htmlFor="price">Unit price (₹) *</label><input id="price" className="form-control" type="number" min="0" step="0.01" value={form.price} onChange={e => updateField("price", e.target.value)} placeholder="0.00" required disabled={busy} /></div>
          <div className="form-field"><label htmlFor="quantity">Current quantity *</label><input id="quantity" className="form-control" type="number" min="0" step="1" value={form.quantity} onChange={e => updateField("quantity", e.target.value)} placeholder="Units available" required disabled={busy || Boolean(editing)} /><small>{editing ? "Use Manage stock to record stock received or sold." : "Enter the opening stock quantity."}</small></div>
          <div className="form-field"><label htmlFor="lowStockThreshold">Low-stock threshold</label><input id="lowStockThreshold" className="form-control" type="number" min="0" step="1" value={form.lowStockThreshold} onChange={e => updateField("lowStockThreshold", e.target.value)} required disabled={busy} /></div>
        </div><div className="form-note"><Icon name="info-circle" /> Fields marked * are required. Use the stock action to keep replenishment and sales separate from product details.</div><div className="modal-actions"><button type="button" className="btn btn-light" onClick={closeForm} disabled={busy}>Cancel</button><button type="submit" className="btn btn-primary-custom" disabled={busy}>{busy && <span className="spinner-border spinner-border-sm me-2" />}{editing ? "Save changes" : "Add medicine"}</button></div></form></section></div>}

      {stockTarget && <div className="modal-backdrop-custom" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setStockTarget(null); }}><section className="app-modal stock-modal" role="dialog" aria-modal="true" aria-labelledby="stock-modal-title"><div className="modal-head"><div><div className="section-kicker">INVENTORY MOVEMENT</div><h2 id="stock-modal-title">Manage stock</h2><p>{stockTarget.name} · {stockTarget.medicineId}</p></div><button className="modal-close" onClick={() => setStockTarget(null)} disabled={busy} aria-label="Close dialog"><Icon name="x-lg" /></button></div><div className="current-stock"><div><span>Current available stock</span><small>Units currently recorded</small></div><strong>{stockTarget.quantity} units</strong></div><form onSubmit={submitStock}><div className="stock-choice"><button type="button" className={stockAction === "receive" ? "selected" : ""} onClick={() => setStockAction("receive")}><Icon name="box-arrow-in-down" /><span>Receive stock</span><small>Add units to inventory</small></button><button type="button" className={stockAction === "sell" ? "selected" : ""} onClick={() => setStockAction("sell")}><Icon name="cart-check" /><span>Record a sale</span><small>Deduct units sold</small></button></div><div className="form-field stock-quantity-field"><label htmlFor="stockAmount">Quantity to {stockAction === "receive" ? "receive" : "sell"}</label><input id="stockAmount" className="form-control" type="number" min="1" max={stockAction === "sell" ? stockTarget.quantity : undefined} step="1" value={stockAmount} onChange={e => setStockAmount(e.target.value)} required disabled={busy} /><small>{stockAction === "sell" ? "Sales cannot exceed available stock." : "Enter the number of units received."}</small></div><div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => setStockTarget(null)} disabled={busy}>Cancel</button><button type="submit" className="btn btn-primary-custom" disabled={busy || !Number.isInteger(Number(stockAmount)) || Number(stockAmount) < 1 || (stockAction === "sell" && Number(stockAmount) > stockTarget.quantity)}>{busy && <span className="spinner-border spinner-border-sm me-2" />}{stockAction === "receive" ? "Confirm receipt" : "Confirm sale"}</button></div></form></section></div>}
    </div>
  );
}

export default App;
