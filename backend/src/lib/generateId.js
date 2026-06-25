const generateNumericId = () => Math.floor(10000 + Math.random() * 90000);

export const generateUniqueId = async (Model) => {
  let id;
  let exists = true;
  while (exists) {
    id = generateNumericId();
    exists = await Model.findById(id);
  }
  return id;
};
