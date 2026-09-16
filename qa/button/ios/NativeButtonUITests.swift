import XCTest

/// Real SwiftUI Button with original native CUKI artwork; includes a same-size visual A/B.
final class NativeButtonUITests: XCTestCase {
  func snapshot(_ name: String) {
    let a = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
    a.name = name; a.lifetime = .keepAlways; add(a)
  }
  func geometry(_ name: String, _ element: XCUIElement) {
    let r = element.frame
    let a = XCTAttachment(string: "{\"x\":\(r.minX),\"y\":\(r.minY),\"width\":\(r.width),\"height\":\(r.height),\"screenWidth\":\(XCUIScreen.main.screenshot().image.size.width)}")
    a.name = name; a.lifetime = .keepAlways; add(a)
  }
  func testStandardGlassButton() {
    continueAfterFailure = false
    let app = XCUIApplication(bundleIdentifier: "host.exp.Exponent")
    app.activate()
    // Expo Go's identified first-run sheet only; never dismiss app errors.
    if app.buttons["Continue"].waitForExistence(timeout: 5) { app.buttons["Continue"].tap() }
    if app.buttons["Go home"].exists && app.buttons["Reload"].exists && app.buttons["Close"].exists { app.buttons["Close"].tap() }
    let button = app.buttons["demo-register"]
    // Recover only a positively identified initial server-connect race. Never
    // dismiss JavaScript/native runtime errors or relax button assertions.
    for _ in 0..<12 {
      if button.waitForExistence(timeout: 5) { break }
      if app.textViews.containing(NSPredicate(format: "label CONTAINS %@", "Could not connect to the server.")).count > 0 && app.buttons["Try again"].exists {
        snapshot("startup-server-retry")
        app.buttons["Try again"].tap()
      }
      if app.buttons["Go home"].exists && app.buttons["Reload"].exists && app.buttons["Close"].exists { app.buttons["Close"].tap() }
    }
    XCTAssertTrue(button.exists, app.debugDescription)
    XCTAssertTrue(button.isEnabled)
    XCTAssertGreaterThan(button.frame.width, 190)
    XCTAssertGreaterThanOrEqual(button.frame.height, 44)
    XCTAssertLessThan(button.frame.height, 100)
    let counter = app.staticTexts["demo-count"]
    func expect(_ n: Int) {
      let p = NSPredicate(format: "label == %@", "Acciones: \(n)")
      expectation(for: p, evaluatedWith: counter)
      waitForExpectations(timeout: 8)
    }
    expect(0); snapshot("01-native-rest")
    geometry("appearance-restored-bounds", button)
    snapshot("appearance-restored")
    app.switches["demo-original"].tap()
    let original = app.buttons["original-register"]
    XCTAssertTrue(original.waitForExistence(timeout: 5))
    geometry("appearance-original-bounds", original)
    snapshot("appearance-original")
    app.switches["demo-original"].tap()
    XCTAssertTrue(button.waitForExistence(timeout: 5))
    expect(0)
    button.tap(); expect(1)
    button.press(forDuration: 1.3); expect(2); snapshot("02-release")
    let start = button.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
    // Move well beyond the system button's touch-retention region. A previous
    // short horizontal exit was accepted by the system; it is retained in the
    // failed-run evidence, not misreported as cancellation. Do not add a custom
    // gesture recognizer just to override Apple's native interaction policy.
    let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0, dy: 0))
      .withOffset(CGVector(dx: button.frame.midX, dy: button.frame.maxY + 180))
    start.press(forDuration: 0.15, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.6)
    expect(2); snapshot("03-cancel-outside")
    app.switches["demo-disabled"].tap(); XCTAssertFalse(button.isEnabled); snapshot("03-disabled")
    app.switches["demo-disabled"].tap(); XCTAssertTrue(button.isEnabled)
    app.switches["demo-busy"].tap(); XCTAssertFalse(button.isEnabled); snapshot("04-busy")
    app.switches["demo-busy"].tap(); XCTAssertTrue(button.isEnabled)
    button.tap(); expect(3); button.tap(); expect(4)
    app.buttons["demo-open-home"].tap()
    let home = app.buttons["home-register"]
    XCTAssertTrue(home.waitForExistence(timeout: 10),app.debugDescription)
    snapshot("05-home")
    home.tap()
    let close = app.buttons["demo-close"]
    XCTAssertTrue(close.waitForExistence(timeout: 8),app.debugDescription)
    snapshot("06-home-action")
    close.tap()
  }
}
