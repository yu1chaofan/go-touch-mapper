package main

import (
	"encoding/binary"
	"os"
)

func handel_touch_using_otg_manager(rotation int) touch_control_func {
	touch_fd, err := os.OpenFile("/dev/hidg0", os.O_RDWR, 0666)
	if err != nil {
		logger.Errorf("无法打开OTG HID设备文件: %s", err.Error())
		os.Exit(4)
	}
	// mouse_fd, err := os.OpenFile("/dev/hidg1", os.O_RDWR, 0666)
	// if err != nil {
	// 	logger.Errorf("无法打开OTG HID设备文件: %s", err.Error())
	// 	os.Exit(4)
	// }
	// keyboard_fd, err := os.OpenFile("/dev/hidg2", os.O_RDWR, 0666)
	// if err != nil {
	// 	logger.Errorf("无法打开OTG HID设备文件: %s", err.Error())
	// 	os.Exit(4)
	// }
	// defer touch_fd.Close()
	// defer mouse_fd.Close()
	// defer keyboard_fd.Close()

	var buf [12]byte
	buf[0] = 0x01
	setReport := func(action uint8, id uint8, x, y uint32) {
		buf[1] = action
		buf[2] = id
		binary.LittleEndian.PutUint32(buf[3:7], x)
		binary.LittleEndian.PutUint32(buf[7:11], y)
		buf[11] = 0
	}

	rot_xy := func(pack touch_control_pack) (int32, int32) { //根据方向旋转坐标
		switch rotation {
		case 0:
			return pack.x, pack.y
		case 1:
			return 0x7ffffffe - pack.y, pack.x
		case 2:
			return 0x7ffffffe - pack.x, 0x7ffffffe - pack.y
		case 3:
			return pack.y, 0x7ffffffe - pack.x
		default:
			return pack.x, pack.y
		}
	}

	return func(control_data touch_control_pack) {
		switch control_data.action {
		case TouchActionRequire, TouchActionMove:
			x, y := rot_xy(control_data)
			setReport(0x01, uint8(control_data.id), uint32(x), uint32(y))
			touch_fd.Write(buf[:])
		case TouchActionRelease:
			setReport(0x00, uint8(control_data.id), 0, 0)
			touch_fd.Write(buf[:])
		}
	}
}
