function isUserPassing(questionLength, score, passingPercentage, type) {
  // Calculate the passing score

  // console.log({
  //   questionLength,
  //   score,
  //   passingPercentage,
  //   type,
  // });

  if (type === "percentage") {
    const isPassing = score >= passingPercentage;
    return isPassing;
  } else {
    let percentage = (score / questionLength) * 100;
    const isPassing = percentage >= passingPercentage;
    // console.log({ percentage, isPassing });
    return isPassing;
  }
}

module.exports = isUserPassing;
