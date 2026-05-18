import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.streaming.sse_manager import sse_manager

router = APIRouter(prefix="/streaming", tags=["Streaming"])

@router.get("/workflows/{workflow_id}/stream")
async def stream_workflow(workflow_id: str):
    async def event_generator():
        queue = sse_manager.get_queue(workflow_id)
        try:
            while True:
                message = await queue.get()
                # Yield in SSE format
                yield f"data: {message}\n\n"
                
                # Close connection string if needed
                if message in ["Workflow completed", "Workflow paused", "Workflow failed"] or message.startswith("Error:"):
                    break
        except asyncio.CancelledError:
            pass
        finally:
            sse_manager.disconnect(workflow_id)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
