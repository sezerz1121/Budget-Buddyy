import React from 'react'

function BudgetCard(props) {
  return (
    <>
        <div className='BudgetCard'>
        <div className='Emoji'>{props.emoji}</div>
        <div className='Item-info'>
        <div className='item-name'>{props.Item}</div>
        <div className='item-date'> {props.Time}</div>
        </div>
        <div className='Budget-price'>₹-{props.price}</div>
        </div>
    </>
  )
}

export default BudgetCard