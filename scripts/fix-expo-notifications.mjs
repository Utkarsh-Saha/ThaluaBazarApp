import fs from 'fs';
import path from 'path';

const targetFile = path.resolve('node_modules', 'expo-notifications', 'build', 'TopicSubscriptionModule.android.js');

if (fs.existsSync(targetFile)) {
  const content = fs.readFileSync(targetFile, 'utf8');
  if (content.includes("requireNativeModule('ExpoTopicSubscriptionModule')")) {
    const patched = content.replace(
      "import { requireNativeModule } from 'expo';\nexport default requireNativeModule('ExpoTopicSubscriptionModule');",
      "import { requireOptionalNativeModule } from 'expo';\nexport default requireOptionalNativeModule('ExpoTopicSubscriptionModule') ?? {};"
    ).replace(
      "requireNativeModule('ExpoTopicSubscriptionModule')",
      "requireOptionalNativeModule('ExpoTopicSubscriptionModule') ?? {}"
    );
    fs.writeFileSync(targetFile, patched, 'utf8');
    console.log('[fix-expo-notifications] Successfully applied Expo Go Android patch for TopicSubscriptionModule.');
  }
}
