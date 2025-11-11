package main

import (
	"fmt"
	"os"

	"golang.org/x/sys/unix"

	"github.com/kenshaw/evdev"
)

func handel_touch_using_direct_touch(index int) touch_control_func {
	fd, err := os.OpenFile(fmt.Sprintf("/dev/input/event%d", index), os.O_RDWR, 0)
	if err != nil {
		logger.Errorf("打开设备失败 : %v，请检查是否有权限写入", err)
		os.Exit(3)
	}
	d := evdev.Open(fd)
	go func() {
		<-global_close_signal
		defer d.Close()
	}()

	MTPositionX := d.AbsoluteTypes()[evdev.AbsoluteMTPositionX]
	MTPositionY := d.AbsoluteTypes()[evdev.AbsoluteMTPositionY]
	direct_screen_x := int64(MTPositionX.Max)
	direct_screen_y := int64(MTPositionY.Max)
	logger.Warnf("数据将直接写入设备真实触屏 (%d, %d)", MTPositionX, MTPositionY)
	translateDirectXY := func(x, y int32) (int32, int32) {
		switch global_device_orientation {
		case 0:
			return int32(int64(x) * direct_screen_x / 0x7ffffffe), int32(int64(y) * direct_screen_y / 0x7ffffffe)
		case 1:
			return int32(int64(0x7ffffffe-y) * direct_screen_x / 0x7ffffffe), int32(int64(x) * direct_screen_y / 0x7ffffffe)
		case 2:
			return int32(int64(0x7ffffffe-x) * direct_screen_x / 0x7ffffffe), int32(int64(0x7ffffffe-y) * direct_screen_y / 0x7ffffffe)
		case 3:
			return int32(int64(y) * direct_screen_x / 0x7ffffffe), int32(int64(0x7ffffffe-x) * direct_screen_y / 0x7ffffffe)
		default:
			return int32(int64(x) * direct_screen_x / 0x7ffffffe), int32(int64(y) * direct_screen_y / 0x7ffffffe)
		}
		return int32(int64(x) * direct_screen_x / 0x7ffffffe), int32(int64(y) * direct_screen_y / 0x7ffffffe)
	}
	var count int32 = 0    //BTN_TOUCH 申请时为1 则按下 释放时为0 则松开
	var last_id int32 = -1 //ABS_MT_SLOT last_id每次动作后修改 如果不等则额外发送MT_SLOT事件
	unixFd := int(fd.Fd())
	go func() {
		<-global_close_signal
		fd.Close()
	}()
	require_init := makeEventsMMap(6 * 24)
	require := makeEventsMMap(5 * 24)

	release := makeEventsMMap(2 * 24)
	switch_release := makeEventsMMap(3 * 24)
	switch_release_btnup := makeEventsMMap(4 * 24)
	release_btnup := makeEventsMMap(3 * 24)

	switch_move := makeEventsMMap(4 * 24)
	move := makeEventsMMap(3 * 24)

	require_init.Events[0] = evdev.Event{Type: EV_ABS, Code: ABS_MT_SLOT, Value: 0}
	require_init.Events[1] = evdev.Event{Type: EV_ABS, Code: ABS_MT_TRACKING_ID, Value: 0}
	require_init.Events[2] = evdev.Event{Type: EV_KEY, Code: BTN_TOUCH, Value: DOWN}
	require_init.Events[3] = evdev.Event{Type: EV_ABS, Code: ABS_MT_POSITION_X, Value: 0}
	require_init.Events[4] = evdev.Event{Type: EV_ABS, Code: ABS_MT_POSITION_Y, Value: 0}
	require_init.Events[5] = evdev.Event{Type: EV_SYN, Code: 0, Value: 0}

	require.Events[0] = evdev.Event{Type: EV_ABS, Code: ABS_MT_SLOT, Value: 0}
	require.Events[1] = evdev.Event{Type: EV_ABS, Code: ABS_MT_TRACKING_ID, Value: 0}
	require.Events[2] = evdev.Event{Type: EV_ABS, Code: ABS_MT_POSITION_X, Value: 0}
	require.Events[3] = evdev.Event{Type: EV_ABS, Code: ABS_MT_POSITION_Y, Value: 0}
	require.Events[4] = evdev.Event{Type: EV_SYN, Code: 0, Value: 0}

	release.Events[0] = evdev.Event{Type: EV_ABS, Code: ABS_MT_TRACKING_ID, Value: -1}
	release.Events[1] = evdev.Event{Type: EV_SYN, Code: 0, Value: 0}

	switch_release.Events[0] = evdev.Event{Type: EV_ABS, Code: ABS_MT_SLOT, Value: 0}
	switch_release.Events[1] = evdev.Event{Type: EV_ABS, Code: ABS_MT_TRACKING_ID, Value: -1}
	switch_release.Events[2] = evdev.Event{Type: EV_SYN, Code: 0, Value: 0}

	switch_release_btnup.Events[0] = evdev.Event{Type: EV_ABS, Code: ABS_MT_SLOT, Value: 0}
	switch_release_btnup.Events[1] = evdev.Event{Type: EV_ABS, Code: ABS_MT_TRACKING_ID, Value: -1}
	switch_release_btnup.Events[2] = evdev.Event{Type: EV_KEY, Code: BTN_TOUCH, Value: UP}
	switch_release_btnup.Events[3] = evdev.Event{Type: EV_SYN, Code: 0, Value: 0}

	release_btnup.Events[0] = evdev.Event{Type: EV_ABS, Code: ABS_MT_TRACKING_ID, Value: -1}
	release_btnup.Events[1] = evdev.Event{Type: EV_KEY, Code: BTN_TOUCH, Value: UP}
	release_btnup.Events[2] = evdev.Event{Type: EV_SYN, Code: 0, Value: 0}

	switch_move.Events[0] = evdev.Event{Type: EV_ABS, Code: ABS_MT_SLOT, Value: 0}
	switch_move.Events[1] = evdev.Event{Type: EV_ABS, Code: ABS_MT_POSITION_X, Value: 0}
	switch_move.Events[2] = evdev.Event{Type: EV_ABS, Code: ABS_MT_POSITION_Y, Value: 0}
	switch_move.Events[3] = evdev.Event{Type: EV_SYN, Code: 0, Value: 0}

	move.Events[0] = evdev.Event{Type: EV_ABS, Code: ABS_MT_POSITION_X, Value: 0}
	move.Events[1] = evdev.Event{Type: EV_ABS, Code: ABS_MT_POSITION_Y, Value: 0}

	return func(control_data touch_control_pack) {
		// write_events := make([]*evdev.Event, 0)
		// start := time.Now()
		if control_data.id == -1 { //在任何正常情况下 这里是拿不到ID=-1的控制包的因此可以直接丢弃
			return
		}
		if control_data.action == TouchActionRequire {
			x, y := translateDirectXY(control_data.x, control_data.y)
			last_id = control_data.id
			if count += 1; count == 1 {
				require_init.Events[0].Value = control_data.id
				require_init.Events[1].Value = control_data.id
				require_init.Events[3].Value = x
				require_init.Events[4].Value = y
				unix.Write(unixFd, require_init.data)
				// packChan <- pack{data: require_init.data, ts: start}
			} else {
				require.Events[0].Value = control_data.id
				require.Events[1].Value = control_data.id
				require.Events[2].Value = x
				require.Events[3].Value = y
				unix.Write(unixFd, require.data)
				// packChan <- pack{data: require.data, ts: start}

			}

		} else if control_data.action == TouchActionRelease {
			if last_id != control_data.id {
				last_id = control_data.id
				if count -= 1; count == 0 {
					switch_release_btnup.Events[0].Value = control_data.id
					unix.Write(unixFd, switch_release_btnup.data)
					// packChan <- pack{data: switch_release_btnup.data, ts: start}
				} else {
					switch_release.Events[0].Value = control_data.id
					unix.Write(unixFd, switch_release.data)
					// packChan <- pack{data: switch_release.data, ts: start}
				}
			} else {
				if count -= 1; count == 0 {
					unix.Write(unixFd, release_btnup.data)
					// packChan <- pack{data: release_btnup.data, ts: start}
				} else {
					unix.Write(unixFd, release.data)
					// packChan <- pack{data: release.data, ts: start}
				}
			}
		} else if control_data.action == TouchActionMove {
			x, y := translateDirectXY(control_data.x, control_data.y)
			if last_id != control_data.id {
				last_id = control_data.id
				switch_move.Events[0].Value = control_data.id
				switch_move.Events[1].Value = x
				switch_move.Events[2].Value = y
				unix.Write(unixFd, switch_move.data)
				// packChan <- pack{data: switch_move.data, ts: start}

			} else {
				move.Events[0].Value = x
				move.Events[1].Value = y
				unix.Write(unixFd, move.data)
				// packChan <- pack{data: move.data, ts: start}
			}
		}
		// logger.Debugf("uinput handeler%v", time.Since(start))
	}
}
