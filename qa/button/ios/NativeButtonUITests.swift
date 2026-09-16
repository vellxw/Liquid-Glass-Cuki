import XCTest

/// Tests the real SwiftUI Button hosted by Expo Go, not a mock or generated animation.
final class NativeButtonUITests: XCTestCase {
  func snapshot(_ name: String) {
    let a = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
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
    XCTAssertTrue(button.waitForExistence(timeout: 100), app.debugDescription)
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
    button.tap(); expect(1)
    button.press(forDuration: 1.3); expect(2); snapshot("02-release")
    let start = button.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
    let end = button.coordinate(withNormalizedOffset: CGVector(dx: 1.7, dy: 0.5))
    start.press(forDuration: 0.3, thenDragTo: end); expect(2)
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
