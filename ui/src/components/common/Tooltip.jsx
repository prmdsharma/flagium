import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Tooltip = ({ label, text, iconOnly = false }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + window.scrollY,
                left: rect.left + rect.width / 2 + window.scrollX
            });
        }
    };

    // Use effect to handle window resize/scroll while visible
    useEffect(() => {
        if (isVisible) {
            window.addEventListener('scroll', updateCoords);
            window.addEventListener('resize', updateCoords);
            return () => {
                window.removeEventListener('scroll', updateCoords);
                window.removeEventListener('resize', updateCoords);
            };
        }
    }, [isVisible]);

    return (
        <span
            className="tooltip-trigger"
            ref={triggerRef}
            onMouseEnter={() => { updateCoords(); setIsVisible(true); }}
            onMouseLeave={() => setIsVisible(false)}
        >
            {!iconOnly && <span>{label}</span>}
            <span className="tooltip-icon">ⓘ</span>
            {isVisible && createPortal(
                <div
                    className="tooltip-box portal-tooltip"
                    style={{
                        position: 'fixed', // Use fixed to ignore scroll context
                        top: coords.top - window.scrollY,
                        left: coords.left - window.scrollX,
                        transform: 'translateX(-50%) translateY(-100%)',
                        marginTop: '-10px',
                        opacity: 1,
                        visibility: 'visible',
                        pointerEvents: 'none',
                        zIndex: 9999
                    }}
                >
                    {text}
                </div>,
                document.body
            )}
        </span>
    );
};

export default Tooltip;
