import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { Button, FormControlLabel, IconButton, Input, Paper, Slider, Switch, Typography } from "@mui/material";
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import ControlPanel from "./ControlPanel";
import DraggableContainer from "./DraggableContainer";
import JoystickListener from "./JoystickListener";
import * as keyNameMap from "./keynamemap.json";


import {
    UploadButton,
    UploadButtonJIETU,
    UploadButton5s,
    FixedIcon,
    GroupFixedIcon,
    CostumedInput,
    WheelShow,
    ViewShow,
} from "./UIcomponents"
import { produce } from "immer"
import FullscreenIcon from '@mui/icons-material/Fullscreen';

function copyToClipboard(text) {
    let transfer = document.createElement('input');
    document.body.appendChild(transfer);
    transfer.value = text;  // 这里表示想要复制的内容
    transfer.focus();
    transfer.select();
    if (document.execCommand('copy')) {
        document.execCommand('copy');
    }
    transfer.blur();
    document.body.removeChild(transfer);
}


function imageUrlToBase64(url) {
    return new Promise((resolve, reject) => {
        // 1. 创建 Image 对象
        const img = new Image();

        // 2. 设置跨域处理（如果需要）
        img.crossOrigin = "Anonymous";

        // 3. 加载图片
        img.src = url;

        img.onload = () => {
            // 4. 创建 Canvas 元素
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 5. 设置 Canvas 尺寸与图片相同
            canvas.width = img.width;
            canvas.height = img.height;

            // 6. 将图片绘制到 Canvas 上
            ctx.drawImage(img, 0, 0);

            try {
                // 7. 转换为 Base64 字符串
                const base64String = canvas.toDataURL('image/png');
                resolve(base64String);
            } catch (e) {
                reject(`转换失败: ${e}`);
            }
        };

        img.onerror = (err) => {
            reject(`图片加载失败: ${err}`);
        };
    });
}


async function getImageObjectUrl(src) {
    try {
        // 1. 使用fetch获取图片资源
        const response = await fetch(src);

        // 2. 检查响应状态
        if (!response.ok) {
            throw new Error(`图片加载失败，状态码: ${response.status}`);
        }

        // 3. 获取图片Blob数据
        const blob = await response.blob();

        // 4. 验证是否为图片类型
        if (!blob.type.startsWith('image/')) {
            throw new Error('获取的资源不是图片类型');
        }

        // 5. 生成并返回Object URL
        return URL.createObjectURL(blob);
    } catch (error) {
        // 6. 错误处理
        console.error('获取图片URL失败:', error);
        throw error; // 可选择重新抛出错误或返回fallback URL
    }
}

export default function ConfigManager() {
    // 屏幕会自适应旋转方向，始终以观看者左上角为原点，向右为x，向下为y
    //所有坐标均为浮点数，真实值为数值*对应方向的屏幕尺寸
    //单向的量，比如轮盘半径，以宽度为标量
    const [config, setConfig] = useState({
        "SCREEN": {
            "SIZE": [
                3200,
                1440
            ]
        },
        "MOUSE": {
            "SWITCH_KEYS": ["KEY_GRAVE"],
            "POS": [
                0.52,
                0.5
            ],
            "SPEED": [
                0.3,
                0.3
            ]
        },
        "WHEEL": {
            "POS": [
                0.17395833333333333,
                0.7361111111111112
            ],
            "RANGE": 0.05,
            "SHIFT_RANGE": 0.11,
            "SHIFT_RANGE_ENABLE": true,
            "SHIFT_RANGE_SWITCH_ENABLE": true,
            "WASD": [
                "KEY_W",
                "KEY_A",
                "KEY_S",
                "KEY_D"
            ]
        },
        "KEY_MAPS": {
            "BTN_LEFT": {
                "TYPE": "PRESS",
                "POS": [
                    0.08333333333333333,
                    0.49074074074074076
                ]
            },
            "BTN_RIGHT": {
                "TYPE": "PRESS",
                "POS": [
                    0.9307291666666667,
                    0.5370370370370371
                ]
            },
            "KEY_C": {
                "TYPE": "PRESS",
                "POS": [
                    0.8317708333333333,
                    0.9305555555555556
                ]
            },
            "KEY_Z": {
                "TYPE": "PRESS",
                "POS": [
                    0.9119791666666667,
                    0.8807870370370371
                ]
            },
            "KEY_SPACE": {
                "TYPE": "PRESS",
                "POS": [
                    0.9338541666666667,
                    0.6944444444444444
                ]
            },
            "KEY_F": {
                "TYPE": "PRESS",
                "POS": [
                    0.7046875,
                    0.6215277777777778
                ]
            },
            "KEY_R": {
                "TYPE": "PRESS",
                "POS": [
                    0.7640625,
                    0.8206018518518519
                ]
            },
            "KEY_1": {
                "TYPE": "PRESS",
                "POS": [
                    0.44427083333333334,
                    0.9131944444444444
                ]
            },
            "KEY_2": {
                "TYPE": "PRESS",
                "POS": [
                    0.5223958333333333,
                    0.9108796296296297
                ]
            },
            "KEY_Q": {
                "TYPE": "PRESS",
                "POS": [
                    0.14114583333333333,
                    0.4074074074074074
                ]
            },
            "KEY_E": {
                "TYPE": "PRESS",
                "POS": [
                    0.2046875,
                    0.41782407407407407
                ]
            },
            "KEY_M": {
                "TYPE": "PRESS",
                "POS": [
                    0.12239583333333333,
                    0.2013888888888889
                ]
            },
            "KEY_TAB": {
                "TYPE": "PRESS",
                "POS": [
                    0.496875,
                    0.07523148148148148
                ]
            }
        },
        "IMG": "data:image/webp;base64,UklGRoIiAABXRUJQVlA4WAoAAAAoAAAAfwwAnwUASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggRiAAAFDMA50BKoAMoAU+MRiMRKIhoRAEACADBLS3cLuwj24D8AAACs3a8XJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtWAAP7/YcP//79pe+0vfaX+vb///TZv02b9Nm/9MWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEVYSUZGAAAATU0AKgAAAAgABAEAAAQAAAABAAAMgAEBAAQAAAABAAAFoAESAAMAAAABAAEAAIdpAAQAAAABAAAAPgAAAAAAAAAAAAAAAA=="
    })

    const [exportButtonText, setExportButtonText] = useState("更新配置")
    const [selectKEY, setSelectKEY] = useState(null)

    // const [uploadButton, setUploadButton] = useState(true);
    const [imgUrl, setImgUrl] = useState(config["IMG"]);

    const [imgSize, setImgSize] = useState([1, 1])
    const getDisplayValueX = useCallback((value) => { return parseInt(value * config["SCREEN"]["SIZE"][0]) }, [config["SCREEN"]["SIZE"]])
    const getDisplayValueY = useCallback((value) => { return parseInt(value * config["SCREEN"]["SIZE"][1]) }, [config["SCREEN"]["SIZE"]])
    const getPostionValueX = useCallback((value) => { return parseInt(value * imgSize[0]) }, [imgSize])
    const getPostionValueY = useCallback((value) => { return parseInt(value * imgSize[1]) }, [imgSize])

    const viewCenterSetting = useRef(false)
    const addingSwitchKey = useRef(false)
    const [addingSwitchKeyInfoText, setAddingSwitchKeyInfoText] = useState("添加映射切换键")

    const handleFileChange = (e) => {
        // setUploadButton(false);
        const reads = new FileReader();
        reads.readAsDataURL(document.getElementById('fileInput').files[0]);
        reads.onload = async function (e) {
            // setImgUrl(this.result);
            // document.body.requestFullscreen();
            const bas64STR = await imageUrlToBase64(this.result)
            setConfig(produce(draft => { draft.IMG = bas64STR }))
            document.body.requestFullscreen();
        };
    }

    const getRemoteApiImg = async (url) => {
        // const objurl = await getImageObjectUrl(url)
        // setImgUrl(objurl)
        // document.body.requestFullscreen();
        const bas64STR = await imageUrlToBase64(url)
        setConfig(produce(draft => { draft.IMG = bas64STR }))
        document.body.requestFullscreen();
    }

    const imgLoaded = () => {
        setImgSize([document.getElementById("img").width, document.getElementById("img").height])
        setConfig(produce(draft => { draft.SCREEN.SIZE = [document.getElementById("img").naturalWidth, document.getElementById("img").naturalHeight] }))
    }



    const handelImgClick = (e) => {
        const rect = document.getElementById("img").getBoundingClientRect()
        const key = selectKEY
        const x = (e.clientX - rect.left) / document.getElementById("img").width;
        const y = (e.clientY - rect.top) / document.getElementById("img").height
        if (x > 1 || y > 1) {//忽略大于屏幕的
            return
        }
        if (viewCenterSetting.current) {
            setConfig(produce(draft => {
                draft.MOUSE.POS = [
                    x, y
                ]
            }))
            viewCenterSetting.current = false
            return
        }


        if (key !== null) {
            if (key === "REL_WHEEL_UP" || key == "REL_WHEEL_DOWN") {
                setConfig(produce(draft => {
                    draft.KEY_MAPS[key] = {
                        "TYPE": "CLICK",
                        "POS": [
                            x,
                            y
                        ],
                        "INTERVAL": [18]
                    }
                }))
            } else {
                setConfig(produce(draft => {
                    draft.KEY_MAPS[key] = {
                        "TYPE": "PRESS",
                        "POS": [
                            x,
                            y
                        ]
                    }
                }))
            }
            if (["BTN_LEFT", "BTN_MIDDLE", "BTN_RIGHT", "BTN_SIDE", "BTN_EXTRA", "REL_WHEEL_DOWN", "REL_WHEEL_UP"].indexOf(key) !== -1) {
                setSelectKEY(null)
            }
        } else {
            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('imgOnNoKeyClick', {
                    detail: { x: x, y: y }
                }))
            } else {
                window.fireEvent(new CustomEvent('imgOnNoKeyClick', {
                    detail: { x: x, y: y }
                }));
            }

        }
    }

    const exportJSON = () => {
        // copyToClipboard(JSON.stringify(config))
        setExportButtonText("配置更新中")
        fetch('/configure/set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        }).then(resp => resp.text()).then(text => {
            setExportButtonText(text)
            setTimeout(() => {
                setExportButtonText("更新配置")
            }, 1000)
        }).catch(err => {
            setExportButtonText(String(err))
            setTimeout(() => {
                setExportButtonText("更新配置")
            }, 1000)
        })
    }
    const OtherSettings = () => {

        const wheelPosSelecting = useRef(false)
        const [range, setRange] = useState(config["WHEEL"]["RANGE"] * 100)
        const [shiftRange, setShiftRange] = useState(config["WHEEL"]["SHIFT_RANGE"] * 100)

        const [setPosButtonDisabled, setSetPosButtonDisabled] = useState(false)
        const readyToSetPos = () => {
            wheelPosSelecting.current = true;
            setSetPosButtonDisabled(true)
        }
        const imgClickListener = (e) => {
            if (wheelPosSelecting.current) {
                setConfig(produce(draft => { draft.WHEEL.POS = [e.detail.x, e.detail.y] }))
                wheelPosSelecting.current = false
                setSetPosButtonDisabled(false)
            }
        }

        useEffect(() => {

            window.addEventListener('imgOnNoKeyClick', imgClickListener)
            return () => {
                window.removeEventListener('imgOnNoKeyClick', imgClickListener)
            }
        }, [])

        return <Paper sx={{
            width: "370px",
            marginLeft: "10px",
        }}>
            <Grid
                container
                direction="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <Grid item>
                    {selectKEY ? <a>&emsp;点击屏幕映射{selectKEY}</a> : <a>&emsp;按下某个按键并点击</a>}
                </Grid>
                <Grid item>
                    <IconButton onClick={() => document.body.requestFullscreen()} ><FullscreenIcon /></IconButton>
                </Grid>
            </Grid>

            <Grid
                container
                spacing={"10px"}
                direction="column"
                justify="center"
                alignItems="center"
                sx={{
                    width: "350px",
                    marginLeft: "10px",
                    marginTop: "1px",
                }}
            >
                <Grid
                    container
                    direction="row"
                    justifyContent="space-evenly"
                    alignItems="center"
                    spacing={"10px"}
                >
                    <Grid item xs={6}>
                        <Button
                            onClick={() => { getRemoteApiImg("/screen.png") }}
                            variant="outlined"
                            sx={{
                                width: "100%",
                                marginTop: "10px",
                            }}
                        >{"获取截图"}</Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Button
                            onClick={() => { setTimeout(() => { getRemoteApiImg("/screen.png") }, 5000) }}
                            variant="outlined"
                            sx={{
                                width: "100%",
                                marginTop: "10px",
                            }}
                        >{"5s后获取截图"}</Button>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            onClick={() => { document.getElementById('fileInput').click(); }}
                            variant="outlined"
                            sx={{
                                width: "100%",
                            }}
                        >{"上传截图"}</Button>
                    </Grid>
                </Grid>
                <Button
                    onClick={exportJSON}
                    variant="outlined"
                    sx={{
                        width: "100%",
                        marginTop: "10px",
                    }}
                >{exportButtonText}</Button>

                <Grid
                    container
                    direction="row"
                    justifyContent="space-evenly"
                    alignItems="center"
                    spacing={"10px"}
                >
                    <Grid item xs={12}>

                        <Typography
                            sx={{
                                width: "100%",
                                marginTop: "10px",
                            }}
                        >
                            鼠标按键
                        </Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Button
                            onClick={() => { setSelectKEY("BTN_LEFT") }}
                            variant="outlined"
                            sx={{
                                width: "100%",
                            }}
                        >{"左键"}</Button>
                    </Grid>
                    <Grid item xs={4}>
                        <Button
                            onClick={() => { setSelectKEY("BTN_MIDDLE") }}
                            variant="outlined"
                            sx={{
                                width: "100%",
                            }}
                        >{"中键"}</Button>
                    </Grid>
                    <Grid item xs={4}>
                        <Button
                            onClick={() => { setSelectKEY("BTN_RIGHT") }}
                            variant="outlined"
                            sx={{
                                width: "100%",
                            }}
                        >{"右键"}</Button>
                    </Grid>
                    <Grid item xs={3}>
                        <Button
                            onClick={() => { setSelectKEY("BTN_EXTRA") }}
                            variant="outlined"
                            sx={{
                                width: "100%",
                            }}
                        >{"前进"}</Button>
                    </Grid>
                    <Grid item xs={3}>
                        <Button
                            onClick={() => { setSelectKEY("BTN_SIDE") }}
                            variant="outlined"
                            sx={{
                                width: "100%",
                            }}
                        >{"后退"}</Button>
                    </Grid>
                    <Grid item xs={3}>
                        <Button
                            onClick={() => { setSelectKEY("REL_WHEEL_UP") }}
                            variant="outlined"
                            sx={{
                                width: "100%",
                            }}
                        >{"滚轮上"}</Button>
                    </Grid>
                    <Grid item xs={3}>
                        <Button
                            onClick={() => { setSelectKEY("REL_WHEEL_DOWN") }}
                            variant="outlined"
                            sx={{
                                width: "100%",
                            }}
                        >{"滚轮下"}</Button>
                    </Grid>



                </Grid>

                <Grid
                    container
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    sx={{
                        height: "50px",
                    }}
                >
                    <a>视角灵敏度&emsp;&emsp;横向 : </a>
                    <CostumedInput defaultValue={config["MOUSE"]["SPEED"][0]} onCommit={(value) => {
                        setConfig(produce(draft => { draft.MOUSE.SPEED[0] = value; }))
                    }} width="40px" />
                    <a> &emsp;纵向 : </a>
                    <CostumedInput defaultValue={config["MOUSE"]["SPEED"][1]} onCommit={(value) => {
                        setConfig(produce(draft => { draft.MOUSE.SPEED[1] = value; }))
                    }} width="40px" />
                </Grid>
                <Grid
                    container
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    sx={{
                        height: "50px",
                    }}
                >
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="center"
                        sx={{
                            height: "50px",
                        }}>
                        <a>{`视角中心位置:(${parseInt(config["MOUSE"]["POS"][0] * config["SCREEN"]["SIZE"][0])} , ${parseInt(config["MOUSE"]["POS"][1] * config["SCREEN"]["SIZE"][1])})`} </a>
                        <Button onClick={() => { viewCenterSetting.current = true }} disabled={setPosButtonDisabled} sx={{ height: "30px", marginLeft: "10px" }} variant="outlined"  >重设</Button>

                    </Grid>
                </Grid>

                <Grid
                    container
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    sx={{
                        // height: "50px",
                    }}
                    spacing={1}
                >
                    <Grid item xs={12}>

                        <Typography
                            sx={{
                                width: "100%",
                                marginTop: "10px",
                            }}
                        >
                            映射切换按键：
                        </Typography>
                    </Grid>
                    {config["MOUSE"]["SWITCH_KEYS"].map((key, index) => {
                        return <Grid item key={index}>
                            <Button
                                key={index}
                                onClick={() => {
                                    setConfig(produce(draft => {
                                        draft.MOUSE.SWITCH_KEYS.splice(index, 1)
                                    }))
                                }}
                                variant="outlined"
                                sx={{
                                    width: "100%",
                                }}
                            ><Typography noWrap>{key}</Typography>
                                <HighlightOffIcon />
                            </Button>
                        </Grid>
                    })}
                    <Grid item key={"添加切换按键"}>
                        <Button
                            key={"添加切换按键"}
                            onClick={() => {
                                addingSwitchKey.current = true;
                                setAddingSwitchKeyInfoText("按下按键以添加")
                            }}
                            variant="contained"
                            sx={{
                                width: "100%",
                                // marginTop: "10px",
                            }}
                        ><Typography noWrap>{addingSwitchKeyInfoText}</Typography>
                        </Button>
                    </Grid>

                </Grid>




                <Grid
                    container
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    sx={{
                        height: "50px",
                    }}>
                    <a>{`左摇杆中心位置:(${parseInt(config["WHEEL"]["POS"][0] * config["SCREEN"]["SIZE"][0])} , ${parseInt(config["WHEEL"]["POS"][1] * config["SCREEN"]["SIZE"][1])})`} </a>
                    <Button onClick={readyToSetPos} disabled={setPosButtonDisabled} sx={{ height: "30px", marginLeft: "10px" }} variant="outlined"  >重设</Button>

                </Grid>

                <Grid
                    container
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    sx={{
                        height: "150px",
                    }}>

                    <Typography gutterBottom>
                        半径
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs>
                            <Slider
                                min={0}
                                max={50}
                                step={1}
                                value={range}
                                onChange={(_, value) => { setRange(value) }}
                                onChangeCommitted={(_, value) => {
                                    setRange(value)
                                    setConfig(produce(draft => { draft.WHEEL.RANGE = Number(value) / 100; }))
                                    if (value > shiftRange) {
                                        setShiftRange(value)
                                        setConfig(produce(draft => { draft.WHEEL.SHIFT_RANGE = Number(value) / 100; }))
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                    <Typography gutterBottom>
                        {config["WHEEL"]["SHIFT_RANGE_ENABLE"] ? "启用shift轮盘" : "禁用shift轮盘"}
                    </Typography>
                    <Switch
                        checked={config["WHEEL"]["SHIFT_RANGE_ENABLE"]}
                        onChange={() => {
                            setConfig(produce(draft => { draft.WHEEL.SHIFT_RANGE_ENABLE = !draft.WHEEL.SHIFT_RANGE_ENABLE; }))
                        }}
                    />

                    <Typography gutterBottom>
                        {config["WHEEL"]["SHIFT_RANGE_SWITCH_ENABLE"] ? "shift切换模式" : "shift长按模式"}
                    </Typography>
                    <Switch
                        checked={config["WHEEL"]["SHIFT_RANGE_SWITCH_ENABLE"]}
                        onChange={() => {
                            setConfig(produce(draft => { draft.WHEEL.SHIFT_RANGE_SWITCH_ENABLE = !draft.WHEEL.SHIFT_RANGE_SWITCH_ENABLE; }))
                        }}
                    />

                    <Grid container spacing={2}>
                        <Grid item xs>
                            <Slider
                                min={range}
                                max={50}
                                step={1}
                                value={shiftRange}
                                onChange={(_, value) => { setShiftRange(value) }}
                                onChangeCommitted={(_, value) => {
                                    setShiftRange(value)
                                    setConfig(produce(draft => { draft.WHEEL.SHIFT_RANGE = Number(value) / 100; }))
                                }}
                            />
                        </Grid>
                    </Grid>

                </Grid>

            </Grid>
        </Paper>
    }


    const Type_click = ({ data }) => {
        return <div>
            <a>点击时间 : </a>
            <CostumedInput defaultValue={data["INTERVAL"][0]} onCommit={(value) => {
                setConfig(produce(draft => { draft.KEY_MAPS[data["KEY"]].INTERVAL = [value] }))
            }} />
            <a> ms</a>
        </div>
    }

    const Type_auto_fire = ({ data }) => {
        return <div>
            <a>点击时长 : </a>
            <CostumedInput defaultValue={data["INTERVAL"][0]} onCommit={(value) => {
                setConfig(produce(draft => { draft.KEY_MAPS[data["KEY"]].INTERVAL[0] = value }))

            }} />
            <a> ms</a>

            <a> &emsp;间隔 : </a>
            <CostumedInput defaultValue={data["INTERVAL"][1]} onCommit={(value) => {
                setConfig(produce(draft => { draft.KEY_MAPS[data["KEY"]].INTERVAL[1] = value }))
            }} />
            <a> ms</a>
        </div>
    }

    const Type_drag = ({ data }) => {
        const waitingForClick = useRef(false)
        const [addButtonDisabled, setAddButtonDisabled] = useState(false)
        const readyToAdd = () => { waitingForClick.current = true; setAddButtonDisabled(true) }
        const addKeyPoint = (x, y) => {
            setConfig(produce(draft => { draft.KEY_MAPS[data["KEY"]].POS_S.push([x, y]) }))
        }

        const removeKeyPoint = (index) => {
            setConfig(produce(draft => { draft.KEY_MAPS[data["KEY"]].POS_S.splice(index, 1) }))
        }

        const imgClickListener = (e) => {
            if (waitingForClick.current) {
                addKeyPoint(e.detail.x, e.detail.y)
                waitingForClick.current = false;
                setAddButtonDisabled(false)
            }
        }
        useEffect(() => {
            window.addEventListener('imgOnNoKeyClick', imgClickListener)
            return () => {
                window.removeEventListener('imgOnNoKeyClick', imgClickListener)
            }
        }, [])

        return <div>
            <Grid container >
                <Grid item xs={6}><a>间隔 : </a>
                    <CostumedInput defaultValue={config.KEY_MAPS[data["KEY"]].INTERVAL[0]} onCommit={(value) => {
                        setConfig(produce(draft => { draft.KEY_MAPS[data["KEY"]].INTERVAL = [value] }))
                    }} />
                    <a> ms </a></Grid>
                <Grid item xs={6}><Button onClick={readyToAdd} disabled={addButtonDisabled} variant="outlined" sx={{
                    height: "30px",
                    width: "105px",
                }}  >添加关键点</Button></Grid>
            </Grid>
            {
                data["POS_S"].map((pos, index) => <div key={index} style={{ display: "flex" }}>
                    <a>{index}&emsp;{`(${getDisplayValueX(pos[0])} , ${getDisplayValueY(pos[1])})`}</a>
                    <IconButton onClick={() => { removeKeyPoint(index) }}>
                        <HighlightOffIcon />
                    </IconButton>
                </div>
                )
            }
        </div>
    }


    const Type_mult_press = ({ data }) => {
        const waitingForClick = useRef(false)
        const [addButtonDisabled, setAddButtonDisabled] = useState(false)
        const readyToAdd = () => { waitingForClick.current = true; setAddButtonDisabled(true) }

        const addKeyPoint = (x, y) => {
            setConfig(produce(draft => { draft.KEY_MAPS[data["KEY"]].POS_S.push([x, y]) }))
        }

        const removeKeyPoint = (index) => {
            setConfig(produce(draft => { draft.KEY_MAPS[data["KEY"]].POS_S.splice(index, 1) }))
        }

        const imgClickListener = (e) => {
            if (waitingForClick.current) {
                console.log("imgClickListener", e.detail);
                addKeyPoint(e.detail.x, e.detail.y)
                waitingForClick.current = false;
                setAddButtonDisabled(false)
            }
        }
        useEffect(() => {
            window.addEventListener('imgOnNoKeyClick', imgClickListener)
            return () => {
                window.removeEventListener('imgOnNoKeyClick', imgClickListener)
            }
        }, [])

        return <div>
            <Grid container >
                <Grid item xs={6}><Button onClick={readyToAdd} disabled={addButtonDisabled} variant="outlined" sx={{
                    height: "30px",
                    width: "105px",
                }}  >添加触摸点</Button></Grid>
            </Grid>
            {
                data["POS_S"].map((pos, index) => <div key={index} style={{ display: "flex" }}>
                    <a>{index}&emsp;{`(${getDisplayValueX(pos[0])} , ${getDisplayValueY(pos[1])})`}</a>
                    <IconButton onClick={() => { removeKeyPoint(index) }}>
                        <HighlightOffIcon />
                    </IconButton>
                </div>
                )
            }
        </div>
    }



    const KeySettingRender = ({ data }) => {
        const isWheel = data["KEY"] === "REL_WHEEL_UP" || data["KEY"] === "REL_WHEEL_DOWN"


        const handleChange = (e) => {
            if (e.target.value === "CLICK") {
                setConfig(produce(draft => {
                    if (Object.keys(config["KEY_MAPS"][data["KEY"]]).indexOf("POS") !== -1) {
                        draft.KEY_MAPS[data["KEY"]] = { "TYPE": "CLICK", "POS": config["KEY_MAPS"][data["KEY"]]["POS"], "INTERVAL": [18] }
                    } else {
                        draft.KEY_MAPS[data["KEY"]] = { "TYPE": "CLICK", "POS": [0.4, 0.4], "INTERVAL": [18] }
                    }
                }))
            } else if (e.target.value === "PRESS") {
                setConfig(produce(draft => {
                    if (Object.keys(config["KEY_MAPS"][data["KEY"]]).indexOf("POS") !== -1) {
                        draft.KEY_MAPS[data["KEY"]] = { "TYPE": "PRESS", "POS": config["KEY_MAPS"][data["KEY"]]["POS"] }
                    } else {
                        draft.KEY_MAPS[data["KEY"]] = { "TYPE": "PRESS", "POS": [0.4, 0.4] }
                    }
                }))
            } else if (e.target.value === "AUTO_FIRE") {
                setConfig(produce(draft => {
                    if (Object.keys(config["KEY_MAPS"][data["KEY"]]).indexOf("POS") !== -1) {
                        draft.KEY_MAPS[data["KEY"]] = { "TYPE": "AUTO_FIRE", "POS": config["KEY_MAPS"][data["KEY"]]["POS"], "INTERVAL": [18, 20] }
                    } else {
                        draft.KEY_MAPS[data["KEY"]] = { "TYPE": "AUTO_FIRE", "POS": [0.4, 0.4], "INTERVAL": [18, 20] }
                    }
                }))
            } else if (e.target.value === "DRAG") {
                setConfig(produce(draft => {
                    draft.KEY_MAPS[data["KEY"]] = { "TYPE": "DRAG", "POS_S": [], "INTERVAL": [18] }
                }))
            } else if (e.target.value === "MULT_PRESS") {
                setConfig(produce(draft => {
                    draft.KEY_MAPS[data["KEY"]] = { "TYPE": "MULT_PRESS", "POS_S": [], }
                }))
            }
        }

        return <Grid
            container
            direction="column"
            padding="10px"
        >
            <Grid
                container
                direction="row"
                justifyContent="flex-start"
                alignItems="center"
            >
                {
                    data["TYPE"] === "PRESS" || data["TYPE"] === "AUTO_FIRE" || data["TYPE"] === "CLICK" ?
                        <Grid item xs={5}><a>{`${data["KEY"]} : (${getDisplayValueX(data["POS"][0])} , ${getDisplayValueY(data["POS"][1])})`}</a></Grid> :
                        <Grid item xs={5}><a>{`${data["KEY"]} `}</a></Grid>
                }
                <Grid item xs={5}>
                    <FormControl>
                        <InputLabel id={`${data["KEY"]}-select`}></InputLabel>
                        <Select
                            labelId={`${data["KEY"]}-select-label`}
                            value={data["TYPE"]}
                            onChange={handleChange}
                            sx={{ height: "30px", }}
                        >
                            {!isWheel && <MenuItem value={"PRESS"}>同步按下释放</MenuItem>}
                            <MenuItem value={"CLICK"}>单次点击</MenuItem>
                            {!isWheel && <MenuItem value={"AUTO_FIRE"}>连发</MenuItem>}
                            <MenuItem value={"DRAG"}>滑动</MenuItem>
                            {!isWheel && <MenuItem value={"MULT_PRESS"}>多点触摸</MenuItem>}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={2}>
                    <IconButton onClick={() => {
                        setConfig(produce(draft => { delete draft.KEY_MAPS[data["KEY"]] }))
                    }}>
                        <HighlightOffIcon />
                    </IconButton>
                </Grid>
            </Grid>
            {data["TYPE"] === "CLICK" ? <Type_click data={data} /> : null}
            {data["TYPE"] === "AUTO_FIRE" ? <Type_auto_fire data={data} /> : null}
            {data["TYPE"] === "DRAG" ? <Type_drag data={data} /> : null}
            {data["TYPE"] === "MULT_PRESS" ? <Type_mult_press data={data} /> : null}

        </Grid>
    }


    useEffect(() => {
        document.onkeydown = (e) => {
            if (e.repeat === false && window.stopPreventDefault !== true) {
                e.preventDefault();
                if (addingSwitchKey.current) {
                    setConfig(produce(draft => {
                        if (draft.MOUSE.SWITCH_KEYS.indexOf(keyNameMap[e.code.toLowerCase()]) === -1) {
                            draft.MOUSE.SWITCH_KEYS.push(keyNameMap[e.code.toLowerCase()])
                            setAddingSwitchKeyInfoText("添加映射切换键")
                        } else {
                            setAddingSwitchKeyInfoText("已存在，请重新添加")

                        }
                    }))
                } else {
                    setSelectKEY(keyNameMap[e.code.toLowerCase()])
                }
            }
        }
        document.onkeyup = (e) => {
            if (window.stopPreventDefault !== true) {
                e.preventDefault();
                setSelectKEY(null)
            }
        }
        document.oncontextmenu = function (e) {
            e.preventDefault();
        };

        window.addEventListener("resize", (e) => {
            if (document.getElementById("img")) {
                setImgSize([document.getElementById("img").width, document.getElementById("img").height])
            }
        })
        fetch("/configure/get")
            .then(resp => resp.json())
            .then(data => setConfig(data))
            .catch(err => {
                console.log(err)
                // setConfig(produce(draft => { draft.IMG = "http://100.82.56.48:61070/screen.png" }))
            })
    }, [])

    const KeyShow = ({ data }) => {
        return <div>
            {data["TYPE"] === "PRESS" || data["TYPE"] === "AUTO_FIRE" || data["TYPE"] === "CLICK" ? <FixedIcon x={getPostionValueX(data["POS"][0])} y={getPostionValueY(data["POS"][1])} text={data["KEY"]} /> : null}
            {data["TYPE"] === "MULT_PRESS" ? <GroupFixedIcon pos_s={data["POS_S"].map(([x, y]) => [getPostionValueX(x), getPostionValueY(y)])} text={data["KEY"]} bgColor={"#00796B"} textColor={"#ffffff"} /> : null}
            {data["TYPE"] === "DRAG" ? <GroupFixedIcon pos_s={data["POS_S"].map(([x, y]) => [getPostionValueX(x), getPostionValueY(y)])} text={data["KEY"]} bgColor={"#3F51B5"} textColor={"#ffffff"} /> : null}
        </div>
    }

    return <div style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#00796B',
    }}>
        <div>{JSON.stringify()}</div>
        <JoystickListener setDowningBtn={(value) => {
            setSelectKEY(value)
        }} />
        <input id="fileInput" type="file" style={{ display: "none" }} accept="image/*" onChange={handleFileChange} ></input>
        <img id="img" src={config["IMG"]} style={{ width: "100vw", left: 0, top: 0 }} onClick={handelImgClick} onLoad={imgLoaded} ></img>
        <DraggableContainer>
            <div
                style={{
                    maxHeight: "80vh",
                    overflowY: "scroll",
                }}
            >
                <Grid
                    container
                    direction="column"
                    justifyContent="flex-start"
                    alignItems="flex-start"
                    spacing={"10px"}
                    sx={{
                        width: "400px",
                        backgroundColor: "#F5F5F5",
                        paddingBottom: "10px",
                        spacing: "0px",
                        paddingTop: "10px",
                    }}
                >
                    <Grid item xs={12}>
                        <OtherSettings />
                    </Grid>
                    {
                        Object.keys(config["KEY_MAPS"]).map((keycode, index) =>
                            <Grid
                                item
                                xs={12}
                                key={keycode}
                            >
                                <Paper
                                    sx={{
                                        width: "370px",
                                        marginLeft: "10px",
                                    }}
                                >
                                    <KeySettingRender data={{ ...config["KEY_MAPS"][keycode], "KEY": keycode }} />
                                </Paper>
                            </Grid>)
                    }
                </Grid>
            </div>
        </DraggableContainer>

        {
            Object.keys(config["KEY_MAPS"]).map((keycode, index) => <KeyShow key={keycode} data={{ ...config["KEY_MAPS"][keycode], "KEY": keycode }} />)
        }
        <WheelShow
            x={getPostionValueX(config["WHEEL"]["POS"][0])}
            y={getPostionValueY(config["WHEEL"]["POS"][1])}
            range={getPostionValueX(config["WHEEL"]["RANGE"])}
            shift_range={config["WHEEL"]["SHIFT_RANGE_ENABLE"] ? getPostionValueX(config["WHEEL"]["SHIFT_RANGE"]) : 0}
        />
        <ViewShow x={getPostionValueX(config["MOUSE"]["POS"][0])} y={getPostionValueY(config["MOUSE"]["POS"][1])} />
        <input id="fileInput" type="file" style={{ display: "none" }} accept="image/*" onChange={handleFileChange} ></input>

    </div>
}
