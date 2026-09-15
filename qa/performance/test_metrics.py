"""No data fabrication: validate parsing with small labelled fixtures only."""
import unittest
from metrics import layer_stats,summarize

class MetricsTest(unittest.TestCase):
 def test_app_layer_only(self):
  fixture='''layerName = StatusBar#4
totalFrames = 100
averageFPS = 120.0
layerName = host.exp.exponent/host.exp.exponent.experience.ExperienceActivity#5
totalFrames = 5
averageFPS = 45.0
totalTimelineFrames = 5
jankyFrames = 2
present2present histogram is as below:
16ms=3 33ms=1
layerName = none
totalFrames = 0
'''
  s=layer_stats(fixture);self.assertEqual(len(s),1);self.assertEqual(s[0]['fps'],45)
  self.assertEqual(s[0]['p50BucketMs'],16);self.assertEqual(s[0]['p95BucketMs'],33)
 def test_missing_data_is_not_60(self):
  self.assertEqual(layer_stats('displayRefreshRate = 60 fps'),[])
 def test_no_cherry_picking_of_fragmented_layer(self):
  data=[{'mode':'A','layers':[{'fps':30},{'fps':60}]}]
  self.assertEqual(summarize(data),{});self.assertFalse(data[0]['validForAB'])
 def test_median_not_best(self):
  data=[{'mode':'A','layers':[{'fps':f}]} for f in [20,30,90]]
  self.assertEqual(summarize(data)['A']['medianFPS'],30)

if __name__=='__main__':unittest.main()
