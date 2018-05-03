package tech.subluminal.client.presentation.customElements;

import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.HBox;
import tech.subluminal.client.presentation.controller.MainController;

public class NameChangeComponent extends HBox {

  private TextField field = new TextField();
  Button change;

  public NameChangeComponent(MainController main){
    HBox box = new HBox();

    change = new Button("Change Name");
    change.setOnAction(e -> {
      main.getChatController().changeName(field.getText());
      field.setText("");
    });


    this.addEventHandler(KeyEvent.KEY_PRESSED, keyEvent -> {
      if(keyEvent.getCode() == KeyCode.ENTER){
        keyEvent.consume();
        change.fire();
      }
    });
    this.getChildren().addAll(field, change);

  }


}
