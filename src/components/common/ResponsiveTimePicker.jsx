import { TimePicker, Input } from 'antd';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

/**
 * A responsive TimePicker that uses Ant Design's TimePicker on desktop
 * and a native HTML5 time input on mobile to trigger the native device picker
 * (like the Material Design clock on Android).
 */
const ResponsiveTimePicker = ({ value, onChange, ...props }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle incoming value to ensure it's a dayjs object for Ant Design or a HH:mm string for native
    const getValues = () => {
        if (!value) return { dayjsValue: null, stringValue: '' };

        if (dayjs.isDayjs(value)) {
            return { dayjsValue: value, stringValue: value.format('HH:mm') };
        }

        if (typeof value === 'string') {
            // If it's a full ISO string or similar
            if (value.includes('T') || value.includes('-')) {
                const d = dayjs(value);
                return { dayjsValue: d, stringValue: d.format('HH:mm') };
            }
            // If it's already HH:mm
            const d = dayjs(`2000-01-01 ${value}`);
            return { dayjsValue: d, stringValue: value };
        }

        return { dayjsValue: null, stringValue: '' };
    };

    const { dayjsValue, stringValue } = getValues();

    if (isMobile) {
        return (
            <Input
                type="time"
                {...props}
                value={stringValue}
                onChange={(e) => {
                    const newValue = e.target.value; // "HH:mm"
                    if (onChange) {
                        const newDayjs = newValue ? dayjs(`2000-01-01 ${newValue}`) : null;
                        onChange(newDayjs, newValue);
                    }
                }}
            />
        );
    }

    return (
        <TimePicker
            {...props}
            value={dayjsValue}
            onChange={(time, timeStr) => {
                if (onChange) {
                    onChange(time, timeStr);
                }
            }}
        />
    );
};

export default ResponsiveTimePicker;
