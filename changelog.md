# Changelog


## [1.1.0] - Sept 15, 2024

This release includes a huge collection of changes to the application. The most notable changes are listed below

- Added a status field to goals. Goals can either be memorizing or reciting. Users will have the option to promote a memorizing goal to a reciting goal once they have reached 100% coverage.
- Added a new goal creation dialog in which users can now specify the starting status of their goal and choose which attempts to include.
- Added a scheduler to recitations, providing recommendations on when to recite a passage based on the user's past performance. This uses the [FSRS algorithm](https://github.com/open-spaced-repetition) to determine the optimal time to review a passage.
- Added a dialog post-recitation to gauge recitaion difficulty. This will help the scheduler determine the time for the next review.
- Added changelog
- Added dialog for new users
- Added dialog for new updates.
- Changed goals to not include attempts that were made before the goal was created by default. Users can now choose to include these attempts in the goal.
- Renamed the 'input' page to the 'recite' page to better reflect its purpose.
- Renamed the 'practice' page to the 'memorize' page to better reflect its purpose.


## [1.0.0] - April 2, 2024