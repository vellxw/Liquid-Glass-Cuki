import android.os.SystemClock;
import android.view.InputDevice;
import android.view.InputEvent;
import android.view.MotionEvent;
import java.io.BufferedReader;
import java.io.FileReader;
import java.lang.reflect.Method;
/** Shell-only CI input tool. Injects ONE continuous native pointer stream. Not shipped in the app. */
public final class InjectPath {
 public static void main(String[] args) throws Exception {
  Class<?> klass=Class.forName("android.hardware.input.InputManager");
  Object manager=klass.getMethod("getInstance").invoke(null);
  Method inject=klass.getMethod("injectInputEvent",InputEvent.class,int.class);
  long origin=SystemClock.uptimeMillis(),down=origin;
  try(BufferedReader input=new BufferedReader(new FileReader(args[0]))){
   String line;
   while((line=input.readLine())!=null){
    if(line.isEmpty()||line.startsWith("#"))continue;
    String[] s=line.split(",");long at=Long.parseLong(s[0]);int action=Integer.parseInt(s[1]);
    float x=Float.parseFloat(s[2]),y=Float.parseFloat(s[3]);
    long wait=origin+at-SystemClock.uptimeMillis();if(wait>0)SystemClock.sleep(wait);
    long now=SystemClock.uptimeMillis();if(action==MotionEvent.ACTION_DOWN)down=now;
    MotionEvent event=MotionEvent.obtain(down,now,action,x,y,0);
    event.setSource(InputDevice.SOURCE_TOUCHSCREEN);
    boolean accepted=(Boolean)inject.invoke(manager,event,1);
    System.out.println("EVENT,"+at+","+(now-origin)+","+action+","+x+","+y+","+accepted);
    event.recycle();
   }
  }
 }
}
