# Pericopy
(More non-technical details at [Pericopy's website](https://pericopy.com/info))

## What is Pericopy? 📚🧠
Pericopy is a web-app dedicated to help people memorize the Bible more effectively. What sets Pericopy apart from other tools is its unique approach to memorization. Once on the website, there are a few avenues to explore. 

If you're still learning a passage, you can head on over to the "Practice" page and start typing what you know. As you type, Pericopy will automatically detect the passage you're working on and diff-check what you've entered. You'll also be able to fill the next word in the passage by pressing the "Tab" key or by clicking the 'Next Word' button.

Once you feel like you've got a good handle on the passage, you'll want to explore the "Test" page. Here, you can test your knowledge of the passage by typing it out without any hints. Once you're satisfied with your attempt, simply press submit and Pericopy will let you know how you did as well as save your score for future reference. Attempts made using this feature will also contribute towards any goals you set and towards your personal accuracy heatmap.

## How does Pericopy work? 🤔
Pericopy uses a unique algorithm to detect the passage you're working on. In a traditional string-matching problem, one might think to utilize a metric like the Levenshtein distance to maximize similarity between the user's input and the correct passage. However, as there are 756470 words in the Bible (ESV) and the Levenshtein distance is O(nm), this approach would be too slow for our purposes. 

Instead, Pericopy uses a single dictionary  mapping each word to the indices at which it appears in the Bible. As the user types, possible passages are narrowed down by intersecting the indices of each word in the user's input. This approach is O(n) and allows for real-time passage detection. We account for typos by dropping the first and last words from the user's input repeatedly until a match is found.

## How can I use Pericopy? 🤓
Pericopy is currently in beta and is available for free at [pericopy.net](https://pericopy.net). If you have any feedback or suggestions, please feel free to reach out to me at [contact@pericopy.net](mailto:contact). I'd love to hear from you!

## Who made Pericopy? 🧑‍💻
Pericopy was made by me (Ian) as a way to help myself memorize the Bible more effectively. I'm a software engineer by trade and I love building things that help people. If you have any questions or would like to reach out, please feel free to email me.


## Enough talk - here's some screenshots! 📸
![Home Page](https://github.com/imatson9119/Pericopy/blob/master/readme-assets/demo1.png?raw=true)

![Test Page](https://github.com/imatson9119/Pericopy/blob/master/readme-assets/demo2.png?raw=true)

![Test Result](https://github.com/imatson9119/Pericopy/blob/master/readme-assets/demo3.png?raw=true)

![Practice Page](https://github.com/imatson9119/Pericopy/blob/master/readme-assets/demo4.png?raw=true)

![Heatmap](https://github.com/imatson9119/Pericopy/blob/master/readme-assets/demo5.png?raw=true)

![Goal Stats](https://github.com/imatson9119/Pericopy/blob/master/readme-assets/demo6.png?raw=true)

