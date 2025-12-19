import React, { useState } from 'react'
import TopHeader from './components/common/TopHeader'
import './App.css'

// Demo component showing both floating and block modes
const TopHeaderDemo = () => {
  const [headerType, setHeaderType] = useState('floating')

  return (
    <div style={{ padding: '2rem', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1>Top Header Demo</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <label>
          <input 
            type="radio" 
            value="floating" 
            checked={headerType === 'floating'} 
            onChange={(e) => setHeaderType(e.target.value)}
          />
          Floating Mode (Fixed position)
        </label>
        <br />
        <label>
          <input 
            type="radio" 
            value="block" 
            checked={headerType === 'block'} 
            onChange={(e) => setHeaderType(e.target.value)}
          />
          Block Mode (Normal flow)
        </label>
      </div>

      <TopHeader type={headerType} />
      
      <div style={{ 
        marginTop: headerType === 'block' ? '2rem' : '8rem', 
        padding: '2rem', 
        background: 'white', 
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2>Content Below Header</h2>
        <p>This content demonstrates how the header behaves in different modes:</p>
        <ul>
          <li><strong>Floating mode:</strong> Header stays fixed at top, content flows underneath</li>
          <li><strong>Block mode:</strong> Header is part of normal document flow</li>
        </ul>
        <p>Click on the buttons in the header to see the expandable panels in action!</p>
        
        <div style={{ height: '200px', background: '#e0e0e0', margin: '1rem 0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Sample content area</p>
        </div>
        
        <div style={{ height: '200px', background: '#d0d0d0', margin: '1rem 0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>More content to demonstrate scrolling</p>
        </div>
        
        <div style={{ height: '200px', background: '#c0c0c0', margin: '1rem 0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Even more content</p>
        </div>
      </div>
    </div>
  )
}

export default TopHeaderDemo