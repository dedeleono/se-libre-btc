"use client";

import { CourseModule } from "@prisma/client";
import { useEffect, useState } from "react";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

import { cn } from "@/lib/utils";
import { Grip, Pencil } from "lucide-react";

interface ModulesListProps {
  items: CourseModule[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string) => void;
}

export const ModulesList = ({ items, onReorder, onEdit }: ModulesListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [modules, setModules] = useState(items);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setModules(items);
  }, [items]);

  const onDragEnd = (result: DropResult) => {
    if(!result.destination) return;

    const items = Array.from(modules);
    const [reOrderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reOrderedItem);

    const startIndex = Math.min(result.source.index, result.destination.index)
    const endIndex = Math.max(result.source.index, result.destination.index)

    const updatedModules = items.slice(startIndex, endIndex + 1)
    setModules(items)

    const bulkUpdateData = updatedModules.map((module, index)=>({
        id: module.id,
        position: items.findIndex((item)=>item.id===module.id)
    }))

    onReorder(bulkUpdateData)

  }

  if (!isMounted) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="modules">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {modules.map((module, index) => (
              <Draggable key={module.id} draggableId={module.id} index={index}>
                {(provided) => (
                  <div
                    className={cn(
                      "flex items-center gap-x-2 bg-slate-200 border-slate-200 border text-slate-700rounded-md mb-4 text-sm"
                    )}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                  >
                    <div
                      className={cn(
                        "px-2 py-3 border-r border-r-slate-200 hover:bg-slate-300 rounded-l-md transition-colors"
                      )}
                      {...provided.dragHandleProps}
                    >
                      <Grip className="h-5 w-5" />
                    </div>
                    {module.title}
                    <div className="ml-auto pr-2 flex items-center gap-x-2">
                      <button
                        type="button"
                        onClick={() => onEdit(module.id)}
                        className="-m-[11px] inline-flex items-center justify-center p-[11px] transition-colors hover:opacity-75 active:scale-[0.96]"
                        aria-label="Edit module"
                      >
                        <Pencil className="w-4 h-4 cursor-pointer" />
                      </button>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
