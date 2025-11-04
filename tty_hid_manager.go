package main

import (
	"encoding/binary"

	"go.bug.st/serial"
)

func handel_touch_using_hid_manager(port serial.Port) touch_control_func {
	var buf [12]byte
	buf[0] = 0xF4
	setReport := func(action uint8, id uint8, x, y uint32) {
		buf[1] = action
		buf[2] = id
		binary.LittleEndian.PutUint32(buf[3:7], x)
		binary.LittleEndian.PutUint32(buf[7:11], y)
		buf[11] = 0
	}

	return func(control_data touch_control_pack) {
		switch control_data.action {
		case TouchActionRequire, TouchActionMove:
			x, y := rotateAbsoluteXY(control_data.x, control_data.y)
			setReport(0x01, uint8(control_data.id), uint32(x), uint32(y))
			port.Write(buf[:])
		case TouchActionRelease:
			setReport(0x00, uint8(control_data.id), 0, 0)
			port.Write(buf[:])
		case TouchActionResetResolution:
			setReport(0x03, uint8(control_data.id), uint32(control_data.x), uint32(control_data.y))
			port.Write(buf[:])
		}
	}
}
