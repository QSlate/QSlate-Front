'use client';

import { Check, Plus, SlidersHorizontal } from 'lucide-react';

import { useLayoutStore } from '@/entities/layout';
import { Dialog } from '@/shared/ui/dialog/Dialog';

export function WidgetPicker({
  widgets,
  onClose,
}: {
  widgets: { id: string; title: string; description: string }[];
  onClose: () => void;
}) {
  const layout = useLayoutStore((state) => state.layout);
  const addWidget = useLayoutStore((state) => state.addWidget);
  const updateWidget = useLayoutStore((state) => state.updateWidget);
  return (
    <Dialog title="Your workspace, your way" onClose={onClose}>
      <p className="lab-dialog-description">
        Add the views you need to explore your strategy.
      </p>
      <div className="lab-widget-picker">
        {widgets.map((widget) => {
          const active = layout.some((item) => item.i === widget.id);
          return (
            <button
              type="button"
              key={widget.id}
              disabled={active}
              onClick={() => {
                addWidget(widget.id);
                onClose();
              }}
            >
              <span>
                <strong>{widget.title}</strong>
                <small>{widget.description}</small>
              </span>
              {active ? <Check size={16} /> : <Plus size={16} />}
            </button>
          );
        })}
      </div>
      <details className="lab-layout-editor">
        <summary>
          <SlidersHorizontal size={14} />
          Layout controls
        </summary>
        <p>
          Desktop grid: 12 columns. You can also drag and resize widgets
          directly.
        </p>
        {layout.map((item) => (
          <fieldset key={item.i}>
            <legend>
              {widgets.find((widget) => widget.id === item.i)?.title ?? item.i}
            </legend>
            {(['x', 'y', 'w', 'h'] as const).map((key) => (
              <label key={key}>
                <span>
                  {{ x: 'Column', y: 'Row', w: 'Width', h: 'Height' }[key]}
                </span>
                <input
                  type="number"
                  aria-label={`${item.i} ${key}`}
                  min={key === 'w' ? item.minW : key === 'h' ? item.minH : 0}
                  max={
                    key === 'w'
                      ? 12
                      : key === 'x'
                        ? 12 - item.w
                        : key === 'h'
                          ? 30
                          : 1000
                  }
                  value={item[key]}
                  onChange={(event) => {
                    const value = event.target.valueAsNumber;
                    if (!Number.isFinite(value)) return;
                    const min =
                      key === 'w'
                        ? (item.minW ?? 1)
                        : key === 'h'
                          ? (item.minH ?? 1)
                          : 0;
                    const max =
                      key === 'w'
                        ? 12
                        : key === 'x'
                          ? 12 - item.w
                          : key === 'h'
                            ? 30
                            : 1000;
                    const next = Math.round(
                      Math.max(min, Math.min(max, value))
                    );
                    updateWidget(item.i, {
                      [key]: next,
                      ...(key === 'w'
                        ? { x: Math.min(item.x, 12 - next) }
                        : {}),
                    });
                  }}
                />
              </label>
            ))}
          </fieldset>
        ))}
      </details>
    </Dialog>
  );
}
