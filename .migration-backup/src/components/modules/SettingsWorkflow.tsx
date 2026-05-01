import { useState } from "react";
import { workflowRules, officers } from "@/data/dummyData";
import { Plus, X } from "lucide-react";

export default function SettingsWorkflow() {
  const [tab, setTab] = useState<"rules" | "users" | "integrations">("rules");
  const [rules, setRules] = useState(workflowRules.map((r, i) => ({ ...r, id: i })));
  const [toast, setToast] = useState("");
  const [showAddRule, setShowAddRule] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const integrations = [
    { name: "Email Notifications", enabled: true, status: "" },
    { name: "SMS Alerts for farmers", enabled: true, status: "" },
    { name: "WhatsApp Bot Integration", enabled: false, status: "Connect" },
    { name: "Satellite Data Feed (ISRO NRSC)", enabled: true, status: "Connected 🟢" },
    { name: "UIDAI Aadhaar Verify API", enabled: true, status: "Connected 🟢" },
    { name: "Land Records API (State Revenue)", enabled: false, status: "Disconnected 🔴" },
    { name: "PFMS Payment Gateway", enabled: true, status: "Connected 🟢" },
  ];

  const [integrationState, setIntegrationState] = useState(integrations.map(i => i.enabled));

  return (
    <div className="space-y-6 animate-fade-in" style={{ opacity: 0 }}>
      {toast && <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in" style={{ opacity: 0 }}>{toast}</div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
        {([["rules", "AI Workflow Rules"], ["users", "User Management"], ["integrations", "Notifications & Integrations"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`text-sm px-4 py-2 rounded-md transition-colors ${tab === k ? "bg-card shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "rules" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddRule(true)} className="text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg flex items-center gap-1.5"><Plus className="h-4 w-4" /> Add New Rule</button>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Rule</th>
                <th className="px-4 py-3 font-medium">Trigger</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr></thead>
              <tbody>{rules.map((r) => (
                <tr key={r.id} className="border-t border-border/50 table-row-alt">
                  <td className="px-4 py-3">{r.rule}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.trigger}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.action}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setRules(prev => prev.map(x => x.id === r.id ? { ...x, enabled: !x.enabled } : x))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${r.enabled ? "bg-success" : "bg-muted"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-transform ${r.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddUser(true)} className="text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg flex items-center gap-1.5"><Plus className="h-4 w-4" /> Add User</button>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">District</th>
                <th className="px-4 py-3 font-medium">Last Login</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>{officers.map(o => (
                <tr key={o.name} className="border-t border-border/50 table-row-alt">
                  <td className="px-4 py-3 font-medium">{o.name}</td>
                  <td className="px-4 py-3">{o.role}</td>
                  <td className="px-4 py-3">{o.district}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.lastLogin}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2.5 py-0.5 rounded-full bg-success/10 text-success">{o.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="text-xs px-2 py-1 rounded bg-muted">Edit</button>
                      <button onClick={() => showToast(`⚠️ ${o.name} deactivated`)} className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">Deactivate</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "integrations" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((intg, i) => (
            <div key={intg.name} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-hover">
              <div>
                <div className="font-medium text-sm">{intg.name}</div>
                {intg.status && <div className="text-xs text-muted-foreground mt-0.5">{intg.status}</div>}
              </div>
              <div className="flex items-center gap-2">
                {!intg.enabled && intg.status.includes("Disconnected") && (
                  <button onClick={() => showToast("🔗 Reconnecting...")} className="text-xs px-3 py-1 rounded bg-secondary text-secondary-foreground">Reconnect</button>
                )}
                {!intg.enabled && intg.status === "Connect" && (
                  <button onClick={() => { setIntegrationState(prev => { const n = [...prev]; n[i] = true; return n; }); showToast("✅ Connected"); }} className="text-xs px-3 py-1 rounded bg-secondary text-secondary-foreground">Connect</button>
                )}
                <button onClick={() => setIntegrationState(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${integrationState[i] ? "bg-success" : "bg-muted"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-transform ${integrationState[i] ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddRule(false)}>
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 animate-fade-in" style={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h2 className="font-heading text-lg">Add Workflow Rule</h2><button onClick={() => setShowAddRule(false)}><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <input placeholder="Rule description" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg" />
              <input placeholder="Trigger event" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg" />
              <input placeholder="Action to perform" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg" />
            </div>
            <button onClick={() => { setShowAddRule(false); showToast("✅ Rule added"); }} className="w-full mt-4 text-sm py-2.5 bg-secondary text-secondary-foreground rounded-lg">Save Rule</button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddUser(false)}>
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 animate-fade-in" style={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4"><h2 className="font-heading text-lg">Add User</h2><button onClick={() => setShowAddUser(false)}><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <input placeholder="Full Name" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg" />
              <input placeholder="Email" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg" />
              <select className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg">
                <option>Select Role</option>
                <option>District Officer</option>
                <option>Field Inspector</option>
                <option>Data Entry</option>
                <option>Grievance Officer</option>
              </select>
              <select className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg">
                <option>Select District</option>
                <option>Nagpur</option><option>Pune</option><option>Amravati</option><option>Nashik</option><option>Latur</option>
              </select>
            </div>
            <button onClick={() => { setShowAddUser(false); showToast("✅ User created"); }} className="w-full mt-4 text-sm py-2.5 bg-secondary text-secondary-foreground rounded-lg">Create User</button>
          </div>
        </div>
      )}
    </div>
  );
}
