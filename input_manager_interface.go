package main

import (
	"bufio"
	"encoding/binary"
	"io/ioutil"
	"net"
	"os"
	"os/exec"
	"strconv"
)

func extractAPK(fileName string, destinationPath string) error {
	// 读取嵌入的 APK 文件内容
	content, err := Asset(fileName)
	if err != nil {
		return err
	}
	// 将 APK 文件内容写入目标文件
	err = ioutil.WriteFile(destinationPath, content, 0644)
	if err != nil {
		return err
	}
	return nil
}

func startInputManager(displayID int) {
	if err := extractAPK("inputManager.apk", "/data/local/tmp/inputManager.apk"); err != nil {
		logger.Errorf("无法提取 APK 文件：%s\n", err)
		return
	}
	cmd := exec.Command("app_process", ".", "com.genymobile.scrcpy.Server", strconv.Itoa(displayID))
	cmd.Env = append(os.Environ(), "CLASSPATH=/data/local/tmp/inputManager.apk")
	err := cmd.Start()
	if err != nil {
		logger.Errorf("无法启动InputManager：%s\n", err)
		os.Exit(1)
	} else {
		// logger.Info("InputManager已启动")
	}
}

func stopInputManager() {
	cmd := exec.Command("pkill", "-f", "com.genymobile.scrcpy.Server")
	cmd.Run()
}

func handel_touch_using_input_manager(displayID int) touch_control_func {
	unixAddr, err := net.ResolveUnixAddr("unix", "@uds_input_manager")
	if err != nil {
		logger.Errorf("创建Unix Domain Socket失败 : %s", err.Error())
		os.Exit(3)
	}
	unixListener, _ := net.ListenUnix("unix", unixAddr)

	logger.Info("waiting for input manager to connect")
	startInputManager(displayID)
	unixConn, _ := unixListener.AcceptUnix()

	logger.Info("input manager connected")
	writer := bufio.NewWriter(unixConn)

	go func() {
		<-global_close_signal
		stopInputManager()
		unixConn.Close()
		unixListener.Close()
	}()
	x := make([]byte, 4)
	y := make([]byte, 4)
	return func(control_data touch_control_pack) {
		action := byte(control_data.action)
		id := byte(control_data.id & 0xff)
		switch global_device_orientation {
		case 0, 2:
			binary.LittleEndian.PutUint32(x, uint32(int64(control_data.x)*int64(control_data.screen_y)/0x7ffffffe))
			binary.LittleEndian.PutUint32(y, uint32(int64(control_data.y)*int64(control_data.screen_x)/0x7ffffffe))
		case 1, 3:
			binary.LittleEndian.PutUint32(x, uint32(int64(control_data.x)*int64(control_data.screen_x)/0x7ffffffe))
			binary.LittleEndian.PutUint32(y, uint32(int64(control_data.y)*int64(control_data.screen_y)/0x7ffffffe))
		}
		writer.Write([]byte{action, id, x[0], x[1], x[2], x[3], y[0], y[1], y[2], y[3]})
		writer.Flush()
	}
}
