import type { ComponentType } from 'react';

import type { LabWidgetType } from '@/entities/widget';

/** Content component of each widget type, provided by the page. */
export type WidgetComponents = Readonly<Record<LabWidgetType, ComponentType>>;
