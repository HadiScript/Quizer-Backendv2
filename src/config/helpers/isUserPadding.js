function isUserPassing(questionLength, score, passingPercentage) {
  // Calculate the passing score

  console.log({
    questionLength,
    score,
    passingPercentage,
  });

  // const passingScore = (passingPercentage / 100) * questionLength;

  // Check if the user's score is greater than or equal to the passing score
  const isPassing = score >= passingPercentage;

  return isPassing;
}

module.exports = isUserPassing;
