
import { User } from "../model/user.model";

export type ID=string;
export interface id {
    getid(): ID;    
}
export interface Initializable {
  /**
 * @returns A Promise that resolves when initialization is complete
 * @throws {InitializationException} If there is an error during repository initialization, such as:

 */

    init(): Promise<void>;
}




export interface IUserRepository<T extends id> {
  
 

    /**
 * Creates a new item in the repository.
 * @param item - The item to be created.
 * @returns A Promise that resolves to the ID of the created item.
 * @throws {InvalidItemException} If the item is invalid or does not meet the required criteria.
 * @throws {DbException} If there is a database error during the creation process.
 */
    create(item: T): Promise<ID>;

    /**
     * Retrieves an item by its ID from the repository.
     * @param id - the id to be found throw repository.
     * @returns A Promise that resolves to the item if found.
     * @throws {ItemNotFoundException} If the item with the specified ID does not exist.
     */
    get(id: ID): Promise<T>;




    
    /**
     * Updates an existing item in the repository.
     * @param item - The item with updated values.
     * @returns A Promise that resolves when the update is complete.
     * @throws {ItemNotFoundException} If the item does not exist.
     * @throws {InvalidItemException} If the updated item is invalid.
     * @throws {DbException} If there is a database error during the update process.
     */
    update(item: T): Promise<void>;
    

  /*get all users
   */
    getall():  Promise<User[]>;



      /**
     * Deletes an item from the repository by its ID.
     * @param id - The unique identifier of the item to delete.
     * @returns A Promise that resolves when the deletion is complete.
     * @throws {ItemNotFoundException} If the item with the specified ID does not exist.
     * @throws {DbException} If there is a database error during the deletion process.
     */

    delete(id: ID): Promise<void>;
}
export interface IRepositoryWithInit<T extends id> extends IUserRepository<T>, Initializable {}