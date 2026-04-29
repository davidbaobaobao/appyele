'use client'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface SortableItemProps {
  id: string
  children: React.ReactNode
}

export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 flex-shrink-0"
        style={{ color: '#8A9BAD', background: 'none', border: 'none' }}
        type="button"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex-1">{children}</div>
    </div>
  )
}

interface SortableListProps {
  items: { id: string }[]
  onReorder: (newItems: { id: string }[]) => void
  children?: React.ReactNode
  renderItem: (item: unknown, index: number) => React.ReactNode
}

export default function SortableList({ items, onReorder, renderItem }: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    onReorder(reordered)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(i => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((item, index) => (
            <SortableItem key={item.id} id={item.id}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
