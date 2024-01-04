import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Spin } from '@douyinfe/semi-ui'
import App from './App'
import { initI18n } from './i18n'
import { bitable } from '@lark-base-open/js-sdk'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <LoadApp />
    </React.StrictMode>
)

function LoadApp() {
    return <App />
}