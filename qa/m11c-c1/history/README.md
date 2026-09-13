# C1 历史测试问题

首次主运行因移动端测试脚本使用合成 pointerdown 并请求无效 pointer capture 而失败。原报告和图片保留在 initial-mobile，未改写为通过。只修复测试脚本后，以真实CDP touchStart/touchMove/touchCancel在独立运行34770237456复测通过；运行源码和Viewer字节没有改变。主运行的其他六组包括性能采样均完成。
