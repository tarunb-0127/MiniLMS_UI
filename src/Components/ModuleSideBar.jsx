// src/components/ModuleSidebar.jsx
import React from "react";

export default function ModuleSidebar({ modules, selectedModule, onSelectModule }) {
  return (
    <div className="col-md-3 mb-3">
      <ul className="list-group">
        {modules.map((m) => (
          <li
            key={m.id}
            className={`list-group-item ${selectedModule?.id === m.id ? "active" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => onSelectModule(m)}
          >
            {m.name} ({m.progressPercentage}%)
          </li>
        ))}
      </ul>
    </div>
  );
}
