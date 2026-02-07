## Vibing (Expo + React Native)

Speed-based in-app volume control for your phone. The app uses GPS speed to adjust the volume of music played inside the app.

### Quick start

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npx expo start
```

### Deploy to iOS without Xcode (EAS Build)

If you want a TestFlight build without Xcode, use EAS Build (requires a paid Apple Developer account).

```bash
npx eas login
npx eas build:configure
npx eas build -p ios --profile production
```

### CI (EAS Build)

We ship a minimal GitHub Actions workflow that can trigger EAS builds. Add an `EXPO_TOKEN` secret to your GitHub repo, then run the workflow manually.

### Ideas

1. Speed/volume up and slow/volume down music based on speed of your phone ( bike tool )
1. when you open air horn app, play button will fire air horn.
1. website that lists available audition calls for theater ( aggregating )
1. simtower clone 
1. reverse simtower, dig down: cooling universe. Must dig down to escape the descending coldness. create warming machines/heaters to slow.. etc.
1. reverse cookbook ( input ingredients, output recipes)
1. mela but better ( cooking app ) 
1. receipt scanning app that tracks prices of what you buy over time, helps you compare prices across stores. 
1. stay in touch app - integrate with messages, email, signal, etc. You input how frequently you want to stay in touch; it keeps track of your interactions with people; and reminds you to reach out to them when you need to.
