# CGO_ENABLE=0 GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o go-touch-mapper
# adb push ./go-touch-mapper /data/local/tmp
# adb push ./configs/EXAMPLE.JSON /data/local/tmp
# # adb shell /data/local/tmp/go-touch-mapper -d -r -c /data/local/tmp/EXAMPLE.JSON 
# adb shell /data/local/tmp/go-touch-mapper -d -r -v



sudo ./go-touch-mapper -r --otg  -d -v --v-mouse-addr 192.168.3.161