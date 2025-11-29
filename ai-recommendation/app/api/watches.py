"""Watch API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from app.db.session import get_session
from app.models import Watch
from app.schemas import WatchCreate, WatchUpdate, WatchResponse

router = APIRouter(prefix="/watches", tags=["watches"])


@router.post("", response_model=WatchResponse)
async def create_watch(
    watch_data: WatchCreate,
    user_id: int = Query(..., description="User ID for the watch"),
    session: Session = Depends(get_session)
):
    """Create a new watch"""
    
    watch = Watch(
        user_id=watch_user_id,
        origin=watch_data.origin,
        destination=watch_data.destination,
        city=watch_data.city,
        max_price=watch_data.max_price,
        check_in=watch_data.check_in,
        check_out=watch_data.check_out,
        watch_type=watch_data.watch_type
    )
    
    session.add(watch)
    session.commit()
    session.refresh(watch)
    
    return WatchResponse.model_validate(watch)


@router.get("/user/{user_id}", response_model=List[WatchResponse])
async def get_user_watches(
    user_id: int,
    active_only: bool = True,
    session: Session = Depends(get_session)
):
    """Get watches for a user"""
    statement = select(Watch).where(Watch.user_id == user_id)
    if active_only:
        statement = statement.where(Watch.active == True)
    
    watches = session.exec(statement).all()
    return [WatchResponse.model_validate(watch) for watch in watches]


@router.get("/{watch_id}", response_model=WatchResponse)
async def get_watch(
    watch_id: int,
    session: Session = Depends(get_session)
):
    """Get watch by ID"""
    watch = session.get(Watch, watch_id)
    if not watch:
        raise HTTPException(status_code=404, detail="Watch not found")
    
    return WatchResponse.model_validate(watch)


@router.put("/{watch_id}", response_model=WatchResponse)
async def update_watch(
    watch_id: int,
    watch_data: WatchUpdate,
    session: Session = Depends(get_session)
):
    """Update a watch"""
    watch = session.get(Watch, watch_id)
    if not watch:
        raise HTTPException(status_code=404, detail="Watch not found")
    
    if watch_data.max_price is not None:
        watch.max_price = watch_data.max_price
    if watch_data.active is not None:
        watch.active = watch_data.active
    if watch_data.check_in is not None:
        watch.check_in = watch_data.check_in
    if watch_data.check_out is not None:
        watch.check_out = watch_data.check_out
    
    session.add(watch)
    session.commit()
    session.refresh(watch)
    
    return WatchResponse.model_validate(watch)


@router.delete("/{watch_id}")
async def delete_watch(
    watch_id: int,
    session: Session = Depends(get_session)
):
    """Delete a watch"""
    watch = session.get(Watch, watch_id)
    if not watch:
        raise HTTPException(status_code=404, detail="Watch not found")
    
    session.delete(watch)
    session.commit()
    
    return {"message": "Watch deleted successfully"}

