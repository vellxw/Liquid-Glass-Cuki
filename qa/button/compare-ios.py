"""Compare native XCTest screenshots of original/restored artwork. No OCR or warping.
Run after exporting attachments, with the screenshot directory as optional argument.
The A/B control is centered at the same position and logical size in the demo.
"""
import json, math, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

folder = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('qa/button/output/screenshots')
manifest = json.loads((folder / 'manifest.json').read_text())
attachments = [a for case in manifest for a in case['attachments']]
def attachment(prefix):
    matches = [a for a in attachments if a['suggestedHumanReadableName'].startswith(prefix + '_')]
    if len(matches) != 1:
        raise ValueError(f'Expected one {prefix} attachment, found {len(matches)}')
    return folder / matches[0]['exportedFileName']

def sample(kind):
    im = Image.open(attachment('appearance-' + kind)).convert('RGB')
    b = json.loads(attachment('appearance-' + kind + '-bounds').read_text())
    # Both controls are centered by the same alignItems:center wrapper. Derive
    # the logical screen width from that geometry, not a guessed device model.
    d = im.width / (2 * b['x'] + b['width'])
    if abs(d - round(d)) > .02:
        raise AssertionError(f'Non-integer pixel ratio or non-centered fixture: {d}')
    d = round(d)
    rect = (round(b['x'] * d), round(b['y'] * d),
            round((b['x'] + b['width']) * d), round((b['y'] + b['height']) * d))
    if rect[0] < 0 or rect[1] < 0 or rect[2] > im.width or rect[3] > im.height:
        raise AssertionError('Invalid capture region')
    return im.crop(rect), b, rect, d

before, b, br, density = sample('original')
after, a, ar, density_after = sample('restored')
assert density == density_after
assert before.size == after.size, (before.size, after.size)
# Comparing raw pixel grids at each recorded control rectangle, not stretching.
for field in ('x', 'y', 'width', 'height'):
    assert abs(a[field] - b[field]) <= 1/density + .001, (field, a[field], b[field])
diff = ImageChops.difference(before, after)
stats = ImageStat.Stat(diff)
result = {'type': 'native iOS screenshot comparison', 'pixelRatio': density,
          'originalRect': br, 'restoredRect': ar, 'regionSize': before.size,
          'MAE': sum(stats.mean)/3,
          'RMSE': math.sqrt(sum(v*v for v in stats.rms)/3),
          'maxChannelError': max(hi for lo,hi in diff.getextrema()),
          'mask': 'full button rectangle; no internal masks, no resizing',
          'nativeBehaviour': 'verified separately by XCTest; not an FPS measurement'}
output = folder.parent
(output/'appearance-result.json').write_text(json.dumps(result, indent=2))
before.save(output/'appearance-original-crop.png')
after.save(output/'appearance-restored-crop.png')
diff.save(output/'appearance-diff.png')
print(json.dumps(result, indent=2))
assert result['MAE'] <= 1.0, 'The system wrapper changed the approved appearance'
