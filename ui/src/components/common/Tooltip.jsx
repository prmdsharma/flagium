import React from 'react';

const Tooltip = ({ label, text, iconOnly = false }) => (
    <span className="tooltip-trigger">
        {!iconOnly && <span>{label}</span>}
        <span className="tooltip-icon">ⓘ</span>
        <div className="tooltip-box">{text}</div>
    </span>
);

export default Tooltip;
