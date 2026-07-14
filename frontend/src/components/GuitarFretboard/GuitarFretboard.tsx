import React, { useRef, useEffect, useState } from "react";
import Card from "../common/Card";
import { MAX_FRETS, MIN_FRET_COUNT } from "../../config/musicConfig";
import "./GuitarFretboard.scss";

const GuitarFretboard = ({ fretboardData, fretCount: fretCountProp = 12 }) => {
    const scrollRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const [scrollState, setScrollState] = useState({ left: false, right: true, showStringNames: true, isScrolling: false });
    const fretCount = Math.max(MIN_FRET_COUNT, Math.min(MAX_FRETS, fretCountProp));

    // Handle scroll detection for fade indicators and string name visibility
    useEffect(() => {
        const handleScroll = () => {
            const element = scrollRef.current;
            if (!element) return;

            const scrollPos = element.scrollLeft;
            const isScrolledLeft = scrollPos > 10;
            const isScrolledRight = scrollPos < element.scrollWidth - element.clientWidth - 10;
            const showStringNames = scrollPos < 50 || scrollPos > 150;

            setScrollState({ left: isScrolledLeft, right: isScrolledRight, showStringNames, isScrolling: true });

            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = setTimeout(() => {
                setScrollState((prev) => ({ ...prev, isScrolling: false }));
            }, 150);
        };

        const element = scrollRef.current;
        if (element) {
            element.addEventListener("scroll", handleScroll);
            setTimeout(handleScroll, 100);
            return () => {
                element.removeEventListener("scroll", handleScroll);
                if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            };
        }
    }, [fretCount]);

    return (
        <Card title="" size="large" className="fretboard-container">
            <div className="fretboard-wrapper">
                <div
                    ref={scrollRef}
                    className={`fretboard-scroll ${scrollState.left ? "scrolled-left" : ""} ${!scrollState.right ? "scrolled-right" : ""} ${scrollState.showStringNames ? "show-string-names" : "hide-string-names"}`}
                >
                    <div className="fretboard-content" style={{ "--fret-cells": fretCount + 1 }}>
                        {/* Fret number headers */}
                        <div className="fret-headers">
                            <div className="string-label-header"></div>
                            {Array.from({ length: fretCount + 1 }, (_, i) => (
                                <div key={i} className="fret-number">
                                    {i}
                                </div>
                            ))}
                        </div>

                        {/* Fretboard strings */}
                        <div className="strings-container">
                            {fretboardData.map((stringData, stringIndex) => (
                                <div key={stringIndex} className="guitar-string">
                                    <div className="string-name">{stringData.string}</div>
                                    <div className="frets-row">
                                        {stringData.frets.slice(0, fretCount + 1).map((fret, fretIndex) => (
                                            <div key={fretIndex} className="fret-cell">
                                                {fretIndex > 0 && <div className="fret-wire"></div>}
                                                <div className="guitar-string-line"></div>
                                                {fret.is_scale_note && (
                                                    <div className={`note-dot ${fret.is_root ? "root-note" : "scale-note"}`} title={`${fret.note} - Fret ${fret.fret}`}>
                                                        {fret.note}
                                                    </div>
                                                )}
                                                {[3, 5, 7, 9, 12, 15, 17, 19, 21].includes(fret.fret) && !fret.is_scale_note && <div className="fret-marker"></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="fretboard-legend">
                <div className="legend-item">
                    <div className="legend-dot root"></div>
                    <span>Root Note</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot scale"></div>
                    <span>Scale Notes</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot marker"></div>
                    <span>Fret Markers</span>
                </div>
            </div>
        </Card>
    );
};

export default GuitarFretboard;
