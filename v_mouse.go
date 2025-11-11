package main

import (
	"fmt"
	"net"
	"os"
	"time"
)

type v_mouse_controller struct {
	touchHandlerInstance *TouchHandler
	uinput_in            chan *u_input_control_pack
	uinput_out           chan *u_input_control_pack
	working              bool
	left_downing         bool
	mouse_x              int32
	mouse_y              int32
	udp_write_ch         chan []byte
	mouse_id             int32
	screen_x             int32
	screen_y             int32
	map_switch_signal    chan bool
	wheel_move_chan      chan int32
}

func init_v_mouse_controller(
	touchHandlerInstance *TouchHandler,
	u_input_control_ch chan *u_input_control_pack,
	fileted_u_input_control_ch chan *u_input_control_pack,
	map_switch_signal chan bool,
	addr net.UDPAddr,
) *v_mouse_controller {
	udp_write_ch := make(chan []byte)
	go (func() {
		// socket, err := net.DialUDP("udp", nil, &addr)
		localAddr, err := net.ResolveUDPAddr("udp", ":0") // 使用随机本地端口
		if err != nil {
			logger.Errorf("解析本地地址失败: %s", err.Error())
			os.Exit(3)
		}
		socket, err := net.ListenUDP("udp", localAddr)
		if err != nil {
			logger.Errorf("udp error : %v", err)
			return
		}
		if err != nil {
			logger.Errorf("连接v_mouse失败 : %s", err.Error())
			os.Exit(3)
		}
		defer socket.Close()
		localAddrReal := socket.LocalAddr().(*net.UDPAddr)
		logger.Infof("v_mouse服务启动在端口: %d", localAddrReal.Port)

		// 启动读取goroutine
		udpRecvCh := make(chan []byte, 100) // 缓冲大小可以根据需要调整
		go func() {
			readBuffer := make([]byte, 32)
			for {
				select {
				case <-global_close_signal:
					close(udpRecvCh) // 关闭管道
					return
				default:
					n, remoteAddr, err := socket.ReadFromUDP(readBuffer)
					if err != nil {
						if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
							continue
						}
						logger.Errorf("读取UDP数据失败: %s", err.Error())
						continue
					}
					if n > 0 {
						data := make([]byte, n)
						copy(data, readBuffer[:n])
						global_device_orientation = int32(data[0])
						logger.Debugf("从 %s 接收到 vpoint上报屏幕方向 %d ", remoteAddr.String(), int32(data[0]))
					}
				}
			}
		}()

		for {
			select {
			case <-global_close_signal:
				return
			default:
				data := <-udp_write_ch
				socket.WriteToUDP(data, &addr)
			}
		}
	})()

	screen_x, screen_y := int32(0), int32(0)
	if global_is_wordking_remote {
		screen_x = global_screen_x
		screen_y = global_screen_y
	} else {
		screen_x, screen_y = get_wm_size()
	}
	wheel_move_chan := make(chan int32, 100)

	return &v_mouse_controller{
		touchHandlerInstance: touchHandlerInstance,
		uinput_in:            u_input_control_ch,
		uinput_out:           fileted_u_input_control_ch,
		working:              true,
		left_downing:         false,
		mouse_x:              0,
		mouse_y:              0,
		udp_write_ch:         udp_write_ch,
		mouse_id:             -1,
		screen_x:             screen_x,
		screen_y:             screen_y,
		map_switch_signal:    map_switch_signal,
		wheel_move_chan:      wheel_move_chan,
	}
}

func (self *v_mouse_controller) get_max_xy_val() (int32, int32) {
	if global_is_wordking_remote {
		return global_screen_x, global_screen_y
	} else {
		if global_device_orientation == 0 || global_device_orientation == 2 {
			return self.screen_x, self.screen_y
		} else {
			return self.screen_y, self.screen_x
		}
	}
}

func (self *v_mouse_controller) main_loop() {
	for {
		select {
		case <-global_close_signal:
			return
		case map_on := <-self.map_switch_signal:
			// logger.Infof("v_mouse map switch signal received: %v", map_on)
			self.working = !map_on
			if self.working {
				self.display_mouse_control(true, self.left_downing, self.mouse_x, self.mouse_y)
			} else {
				self.display_mouse_control(false, false, 0, 0)
				if self.left_downing {
					self.left_downing = false
					self.touchHandlerInstance.touch_release(self.mouse_id)
					self.mouse_id = -1
				}
			}
		case data := <-self.uinput_in:
			if data.action == UInput_mouse_move {
				self.on_mouse_move(data.arg1, data.arg2)
			} else if data.action == UInput_mouse_wheel {
				if data.arg1 == REL_WHEEL {
					go self.on_hwheel_action(data.arg2)
				}
			} else {
				if data.arg1 >= 0x110 && data.arg1 <= 0x117 {
					if data.arg1 == 0x110 {
						self.on_left_btn(data.arg2)
					}
				} else {
					self.uinput_out <- data
				}
			}
		}
	}
}

func (self *v_mouse_controller) display_mouse_control(show, downing bool, abs_x, abs_y int32) { //控制鼠标图标
	var show_int int32
	if show {
		show_int = 1
	} else {
		show_int = 0
	}
	var downing_int int32
	if downing {
		downing_int = 1
	} else {
		downing_int = 0
	}
	fmt_str := fmt.Sprintf("%d,%d,%d,%d,%d", abs_x, abs_y, show_int, downing_int, global_device_orientation)
	self.udp_write_ch <- []byte(fmt_str)
}

func (self *v_mouse_controller) on_mouse_move(rel_x, rel_y int32) {
	if self.working {
		self.mouse_x += rel_x
		self.mouse_y += rel_y
		max_x, max_y := self.get_max_xy_val()
		if self.mouse_x < 0 {
			self.mouse_x = 0
		}
		if self.mouse_y < 0 {
			self.mouse_y = 0
		}
		if self.mouse_x > max_x {
			self.mouse_x = max_x
		}
		if self.mouse_y > max_y {
			self.mouse_y = max_y
		}
		self.display_mouse_control(true, self.left_downing, self.mouse_x, self.mouse_y)
		if self.left_downing && self.mouse_id != -1 {
			self.touchHandlerInstance.touch_move(self.mouse_id, int32(int64(self.mouse_x)*0x7ffffffe/int64(max_x)), int32(int64(self.mouse_y)*0x7ffffffe/int64(max_y)), false)
		}
	} else {
		logger.Error("ERROR: mouse_move: not working")
	}
}

func (self *v_mouse_controller) on_left_btn(up_down int32) {
	if self.working {
		if up_down == DOWN {
			self.left_downing = true
			max_x, max_y := self.get_max_xy_val()
			self.mouse_id = self.touchHandlerInstance.touch_require(int32(int64(self.mouse_x)*0x7ffffffe/int64(max_x)), int32(int64(self.mouse_y)*0x7ffffffe/int64(max_y)), false)

		} else {
			self.left_downing = false
			self.touchHandlerInstance.touch_release(self.mouse_id)
			self.mouse_id = -1
		}
		self.on_mouse_move(0, 0)
	} else {
		logger.Error("ERROR: left_btn: not working")
	}
}

func (self *v_mouse_controller) on_hwheel_action(value int32) { //有待优化
	if self.working {
		self.wheel_move_chan <- value * -40
	} else {
		logger.Error("ERROR: hwheel_action: not working")
	}
}

func (self *v_mouse_controller) loop_handel_v_mouse_wheel_move() {
	var wheel_move_id int32 = -1
	wheel_x := self.mouse_x
	wheel_y := self.mouse_y
	counter := 0
	for {
		select {
		case <-global_close_signal:
			return
		case value := <-self.wheel_move_chan:
			counter = 0
			max_x, max_y := self.get_max_xy_val()
			if wheel_move_id == -1 {
				if self.mouse_y+value < 0 || self.mouse_y+value > max_y {
					continue
				} else {
					wheel_move_id = self.touchHandlerInstance.touch_require(int32(int64(self.mouse_x)*0x7ffffffe/int64(max_x)), int32(int64(self.mouse_y)*0x7ffffffe/int64(max_y)), false)
					self.touchHandlerInstance.touch_move(wheel_move_id, int32(int64(self.mouse_x)*0x7ffffffe/int64(max_x)), int32(int64(self.mouse_y+value)*0x7ffffffe/int64(max_y)), false)
					wheel_x = self.mouse_x
					wheel_y = self.mouse_y + value
				}
			} else {
				if wheel_y+value < 0 || wheel_y+value > max_y {
					self.touchHandlerInstance.touch_release(wheel_move_id)
					wheel_move_id = self.touchHandlerInstance.touch_require(int32(int64(self.mouse_x)*0x7ffffffe/int64(max_x)), int32(int64(self.mouse_y)*0x7ffffffe/int64(max_y)), false)
					self.touchHandlerInstance.touch_move(wheel_move_id, int32(int64(self.mouse_x)*0x7ffffffe/int64(max_x)), int32(int64(self.mouse_y+value)*0x7ffffffe/int64(max_y)), false)
					wheel_x = self.mouse_x
					wheel_y = self.mouse_y + value
				} else {
					self.touchHandlerInstance.touch_move(wheel_move_id, int32(int64(wheel_x)*0x7ffffffe/int64(max_x)), int32(int64(wheel_y+value)*0x7ffffffe/int64(max_y)), false)
					wheel_y += value
				}
			}
		default:
			if counter < 200 {
				counter++
				time.Sleep(time.Duration(1) * time.Millisecond)
				if counter == 200 {
					if wheel_move_id != -1 {
						max_x, max_y := self.get_max_xy_val()
						self.touchHandlerInstance.touch_move(wheel_move_id, int32(int64(wheel_x)*0x7ffffffe/int64(max_x+1)), int32(int64(wheel_y)*0x7ffffffe/int64(max_y)), false)
						time.Sleep(time.Duration(1) * time.Millisecond)
						self.touchHandlerInstance.touch_move(wheel_move_id, int32(int64(wheel_x)*0x7ffffffe/int64(max_x-1)), int32(int64(wheel_y)*0x7ffffffe/int64(max_y)), false)
						time.Sleep(time.Duration(1) * time.Millisecond)
						self.touchHandlerInstance.touch_release(wheel_move_id)
						wheel_move_id = -1
					}
				}
			}
		}
	}
}
