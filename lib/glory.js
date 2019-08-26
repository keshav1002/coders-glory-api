const AWS = require("aws-sdk"),
  nodemailer = require("nodemailer"),
  codecommit = new AWS.CodeCommit(),
  codebuild = new AWS.CodeBuild(),
  helper = require("./helper"),
  responseObj = helper.responseObj,
  ses = new AWS.SES({ region: "us-east-1" }),
  s3 = new AWS.S3(),
  CODE_BUILD_NAME = process.env.codeBuildName,
  EMAIL_ADDRESS = process.env.emailAddress;

let getPullRequestId = message => {
  let prUrl = message.match(/\bhttps?:\/\/\S+/gi);
  return prUrl[0].split("pull-requests/")[1].split("?")[0];
};

let getGetPrInfo = id => {
  const params = {
    pullRequestId: id
  };
  return codecommit.getPullRequest(params).promise();
};

let triggerCodeBuild = sourceVersion => {
  const params = {
    projectName: CODE_BUILD_NAME,
    sourceVersion
  };
  return codebuild.startBuild(params).promise();
};

module.exports.triggerCodeBuild = async (event, cb) => {
  console.log("Event", JSON.stringify(event));
  try {
    const prId = getPullRequestId(event.Records[0].Sns.Message);
    const prInfo = await getGetPrInfo(prId);
    console.log("PR Info", JSON.stringify(prInfo));
    const sourceVersion =
      prInfo.pullRequest.pullRequestTargets[0].sourceReference;
    const triggerResult = await triggerCodeBuild(sourceVersion);
    console.log("Trigger Successful", JSON.stringify(triggerResult));
    cb(null, responseObj(triggerResult, 200));
  } catch (err) {
    console.error(err);
    cb(responseObj(err, 500));
  }
};

let sendEmail = (email, userName, fileName, s3Obj) => {
  let mailOptions = {
    from: email,
    subject: `Coders Glory Report Ready for ${userName}`,
    html: `<p>Report is Ready for ${userName}</p>`,
    to: email,
    attachments: [
      {
        filename: fileName,
        content: s3Obj.Body
      }
    ]
  };
  let transporter = nodemailer.createTransport({
    SES: ses
  });
  return transporter.sendMail(mailOptions);
};

let getPdf = (bucket, key) => {
  let params = {
    Bucket: bucket,
    Key: key
  };
  return s3.getObject(params).promise();
};

module.exports.emailReport = async (event, cb) => {
  console.log("Event", JSON.stringify(event));
  const fileName = event.Records[0].s3.object.key;
  const userName = fileName.split(".")[0].split("_")[0];
  const bucketName = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  try {
    const s3Obj = await getPdf(bucketName, key);
    const emailResult = await sendEmail(EMAIL_ADDRESS, userName, key, s3Obj);
    console.log("Email Sent Successfully", emailResult);
    cb(null, responseObj(emailResult, 200));
  } catch (error) {
    console.log(err);
    cb(responseObj(err, 500));
  }
};
