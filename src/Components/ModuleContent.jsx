// src/components/ModuleContent.jsx
import React from "react";

export default function ModuleContent({ module, getFileUrl, videoRef, onVideoPause, onVideoEnd }) {
  if (!module) return null;

  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body">
        <h5 className="card-title">{module.name}</h5>
        {/\.(mp4|webm|ogg)$/i.test(module.filePath) ? (
          <video
            ref={videoRef}
            src={getFileUrl(module.filePath)}
            controls
            className="w-100 mb-2"
            style={{ maxHeight: 400 }}
            onPause={onVideoPause}
            onEnded={onVideoEnd}
          />
        ) : (
          <a href={getFileUrl(module.filePath)} download className="btn btn-sm btn-outline-secondary mb-2">
            Download File
          </a>
        )}
        <p className="mt-2 text-muted">{module.description || "No description provided."}</p>
      </div>
    </div>
  );
}
