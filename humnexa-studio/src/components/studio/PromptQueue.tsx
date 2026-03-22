"use client";

import { Clock3 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useStudioStore } from "@/store/studioStore";
import type { QueueItem } from "@/types/studio";

export function PromptQueue(): React.ReactElement | null {
  const queue = useStudioStore((state) => state.queue);
  const setQueue = useStudioStore((state) => state.setQueue);
  const removeQueueItem = useStudioStore((state) => state.removeQueueItem);
  const sensors = useSensors(useSensor(PointerSensor));

  if (queue.length === 0) return null;

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = queue.findIndex((item) => item.id === active.id);
    const newIndex = queue.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setQueue(arrayMove(queue, oldIndex, newIndex));
  };

  return (
    <div className="mb-3 rounded-xl border border-brand-border bg-brand-card2 p-3">
      <p className="mb-2 inline-flex items-center gap-2 text-xs text-brand-sub">
        <Clock3 className="h-3.5 w-3.5" />
        Prompt queue
      </p>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext
          items={queue.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {queue.map((item: QueueItem) => (
              <QueueRow
                key={item.id}
                item={item}
                onRemove={() => removeQueueItem(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function QueueRow({
  item,
  onRemove,
}: {
  item: QueueItem;
  onRemove: () => void;
}): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="flex items-center gap-2 rounded-lg border border-brand-border/70 bg-brand-card px-3 py-2 text-sm"
    >
      <button
        type="button"
        className="cursor-grab text-brand-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        ≡
      </button>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1">{item.prompt}</p>
        <p className="text-xs text-brand-muted">~{item.estimatedCost} credits</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-xs text-brand-sub hover:text-brand-error"
      >
        ×
      </button>
    </div>
  );
}
